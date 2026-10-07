import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { Prisma } from '@yuma/db';
import type { OrderStatus } from '@yuma/types';
import { PrismaService } from '../../database/prisma.service';
import { S3Service } from '../../shared/storage/s3.service';
import { faMessages } from '../../common/messages.fa';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStateMachine } from './state-machine/order-state-machine';

/** پیشوند کد پیگیری سفارش */
const TRACKING_CODE_PREFIX = 'YM-';
/** طول بخش تصادفی کد پیگیری */
const TRACKING_CODE_LENGTH = 6;
/** الفبای کد پیگیری — خوانا و بدون کاراکترهای ابهام‌برانگیز */
const TRACKING_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** حداکثر تلاش برای تولید کد پیگیری یکتا */
const MAX_TRACKING_CODE_ATTEMPTS = 10;

/**
 * سرویس سفارش‌ها — ثبت و مشاهده سفارشات مشتریان
 * مبالغ به ریال (IRR) ذخیره می‌شوند
 */
@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly stateMachine: OrderStateMachine,
  ) {}

  /**
   * ثبت سفارش جدید — قیمت‌ها از دیتابیس خوانده می‌شوند و سفارش،
   * اقلام و پیش‌فاکتور اولیه در یک تراکنش ثبت می‌شوند
   */
  async createOrder(dto: CreateOrderDto) {
    // ۱) واکشی سرویس‌های قالیشویی — قیمت واحد از سمت سرور معتبر است
    const services = await this.prisma.laundryService.findMany({
      where: { id: { in: dto.items.map((item) => item.serviceId) } },
      select: { id: true, laundryId: true, unitPrice: true, isActive: true },
    });

    const serviceById = new Map(services.map((service) => [service.id, service]));

    // ۲) اعتبارسنجی اقلام — هر قلم باید وجود داشته باشد، متعلق به
    // قالیشویی درخواستی باشد و فعال باشد. قیمت از سرور تکمیل می‌شود
    const pricedItems = dto.items.map((item) => {
      const service = serviceById.get(item.serviceId);

      if (!service) {
        throw new NotFoundException('قلم خدمات سفارش یافت نشد');
      }

      if (service.laundryId !== dto.laundryId || !service.isActive) {
        throw new BadRequestException(
          'یکی از اقلام خدمات متعلق به این قالیشویی نیست یا فعال نیست',
        );
      }

      return {
        serviceId: item.serviceId,
        quantity: item.quantity,
        unitPrice: service.unitPrice,
        areaSqm: item.areaSqm,
      };
    });

    // ۳) جمع کل از روی اقلام — حاصل‌ضرب تعداد در قیمت واحد (ریال)
    const totalAmount = pricedItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const trackingCode = await this.generateUniqueTrackingCode();

    // ۴) ثبت در یک تراکنش: سفارش + اقلام + پیش‌فاکتور اولیه
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          trackingCode,
          customerId: dto.customerId,
          laundryId: dto.laundryId,
          status: 'pending',
          province: dto.address.province,
          city: dto.address.city,
          postalCode: dto.address.postalCode,
          fullAddress: dto.address.fullAddress,
          latitude:
            dto.address.latitude !== undefined
              ? new Prisma.Decimal(dto.address.latitude)
              : undefined,
          longitude:
            dto.address.longitude !== undefined
              ? new Prisma.Decimal(dto.address.longitude)
              : undefined,
          description: dto.description,
          pickupTimeSlot: dto.pickupTimeSlot,
          totalAmount,
          items: {
            create: pricedItems.map((item) => ({
              serviceId: item.serviceId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              areaSqm:
                item.areaSqm !== undefined
                  ? new Prisma.Decimal(item.areaSqm)
                  : undefined,
            })),
          },
        },
        include: { items: true },
      });

      // لاگ اولین وضعیت در تاریخچه — سفارش از pending شروع می‌شود
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'pending',
          actorId: dto.customerId,
        },
      });

      // پیش‌فاکتور اولیه — هزینه ارسال و مالیات بعداً به آن افزوده می‌شود
      await tx.quotation.create({
        data: {
          orderId: order.id,
          subtotalAmount: totalAmount,
          deliveryFee: 0,
          taxAmount: 0,
          totalAmount,
          status: 'draft',
        },
      });

      return order;
    });
  }

  /** لیست سفارشات مشتری — مرتب بر اساس جدیدترین سفارش */
  getCustomerOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  /**
   * آپلود تصاویر سفارش — مالکیت سفارش بررسی، فایل‌ها روی S3 و
   * متادیتا در جدول OrderMedia ذخیره می‌شوند
   */
  async uploadOrderMedia(
    orderId: string,
    customerId: string,
    files: Express.Multer.File[],
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true },
    });

    if (!order) throw new NotFoundException(faMessages.order.notFound);

    // فقط صاحب سفارش می‌تواند تصویر اضافه کند
    if (order.customerId !== customerId) {
      throw new ForbiddenException(faMessages.common.forbidden);
    }

    // آپلود همزمان فایل‌ها و ساخت رکوردهای متادیتا
    const media = await Promise.all(
      files.map(async (file) => ({
        orderId,
        fileUrl: await this.s3.uploadFile(file, `orders/${orderId}`),
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      })),
    );

    await this.prisma.orderMedia.createMany({ data: media });

    return media;
  }

  /**
   * تخصیص سفیر به سفارش — وضعیت باید بتواند به assigned تغییر کند.
   * در یک تراکنش: driverId ثبت، status به assigned و لاگ تاریخچه
   */
  async assignDriver(orderId: string, driverId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!order) throw new NotFoundException(faMessages.order.notFound);

    // ماشین وضعیت اجازه این انتقال را می‌دهد؟
    if (!this.stateMachine.canTransition(order.status, 'assigned')) {
      throw new BadRequestException(faMessages.order.invalidTransition);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { driverId, status: 'assigned' },
        include: { items: true, media: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'assigned',
          note: `تخصیص سفیر به سفارش`,
        },
      });

      return updated;
    });
  }

  /**
   * تغییر وضعیت سفارش — انتقال باید طبق ماشین وضعیت مجاز باشد.
   * در یک تراکنش: status آپدیت شده و رخداد با اطلاعات بازیگر در تاریخچه لاگ می‌شود
   */
  async changeOrderStatus(
    orderId: string,
    actorId: string,
    actorRole: string,
    toStatus: OrderStatus,
    note?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!order) throw new NotFoundException(faMessages.order.notFound);

    // ماشین وضعیت اجازه این انتقال را می‌دهد؟
    if (!this.stateMachine.canTransition(order.status, toStatus)) {
      throw new BadRequestException(faMessages.order.invalidTransition);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: toStatus },
        include: { items: true, media: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: toStatus,
          note,
          actorId,
          actorRole,
        },
      });

      return updated;
    });
  }

  /**
   * لغو سفارش — فقط صاحب سفارش و فقط قبل از شروع شستشو.
   * وضعیت به cancelled تغییر کرده و دلیل لغو در تاریخچه لاگ می‌شود
   */
  async cancelOrder(orderId: string, customerId: string, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true, status: true },
    });

    if (!order) throw new NotFoundException(faMessages.order.notFound);

    // فقط صاحب سفارش می‌تواند آن را لغو کند
    if (order.customerId !== customerId) {
      throw new ForbiddenException(faMessages.common.forbidden);
    }

    // لغو فقط قبل از شروع شستشو مجاز است
    if (!this.stateMachine.isCancellable(order.status)) {
      throw new BadRequestException(faMessages.order.notCancellable);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' },
        include: { items: true, media: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'cancelled',
          note: reason,
          actorId: customerId,
          actorRole: 'customer',
        },
      });

      return updated;
    });
  }

  /** تولید کد پیگیری تصادفی و یکتا — YM-XXXXXX */
  private async generateUniqueTrackingCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_TRACKING_CODE_ATTEMPTS; attempt += 1) {
      const code = `${TRACKING_CODE_PREFIX}${this.randomCode()}`;
      const exists = await this.prisma.order.findUnique({
        where: { trackingCode: code },
        select: { id: true },
      });
      if (!exists) return code;
    }

    throw new Error(faMessages.common.internal);
  }

  /** بخش تصادفی کد پیگیری از الفبای خوانا */
  private randomCode(): string {
    let code = '';
    for (let i = 0; i < TRACKING_CODE_LENGTH; i += 1) {
      code += TRACKING_CODE_ALPHABET[randomInt(TRACKING_CODE_ALPHABET.length)];
    }
    return code;
  }
}
