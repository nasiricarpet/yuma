import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { Prisma } from '@yuma/db';
import type { OrderFlowStatus } from '@yuma/types';
import { PrismaService } from '../../database/prisma.service';
import { S3Service } from '../../shared/storage/s3.service';
import { faMessages } from '../../common/messages.fa';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { AdminListOrdersDto } from './dto/admin-list-orders.dto';
import {
  OrderStateMachine,
  toFlowStatus,
  type TransitionRule,
} from './state-machine/order-state-machine';

/** پیشوند کد پیگیری سفارش */
const TRACKING_CODE_PREFIX = 'YUMA-';
/** طول بخش تصادفی کد پیگیری */
const TRACKING_CODE_LENGTH = 6;
/** الفبای کد پیگیری — خوانا و بدون کاراکترهای ابهام‌برانگیز */
const TRACKING_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** حداکثر تلاش برای تولید کد پیگیری یکتا */
const MAX_TRACKING_CODE_ATTEMPTS = 10;
/** روابطی که در پاسخ‌های سفارش همراه مدل اصلی بارگذاری می‌شوند */
const ORDER_INCLUDE = {
  items: true,
  media: true,
  laundry: { select: { id: true, name: true, city: true } },
  driver: { select: { id: true, userId: true } },
} as const satisfies Prisma.OrderInclude;

/** روابط کامل برای نمای ادمین — به اضافهٔ مشتری، تاریخچه و پرداخت‌ها */
const ADMIN_ORDER_INCLUDE = {
  items: true,
  media: true,
  laundry: { select: { id: true, name: true, city: true } },
  driver: { select: { id: true, userId: true } },
  customer: { select: { id: true, fullName: true, mobile: true } },
  statusHistory: { orderBy: { createdAt: 'asc' } },
  quotation: true,
  assignments: true,
  payments: true,
} as const satisfies Prisma.OrderInclude;

/**
 * سرویس سفارش‌ها — ثبت، پیگیری و چرخه عمر سفارش برای
 * مشتری، کارگاه، سفیر و ادمین. مبالغ به ریال (IRR) ذخیره می‌شوند.
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
   * اقلام، اولین رخداد تاریخچه و پیش‌فاکتور اولیه در یک تراکنش ثبت می‌شوند.
   *
   * `idempotencyKey` تضمین می‌کند ارسال دوبارهٔ یک درخواست،
   * سفارش جدیدی نسازد و همان سفارش قبلی برگردانده شود.
   */
  async createOrder(actor: AuthUser, dto: CreateOrderDto) {
    // ۱) idempotency — سفارشِ همین کلید را برمی‌گردانیم تا ثبت تکراری نشود
    const existing = await this.prisma.order.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: { items: true },
    });
    if (existing) return existing;

    // ۲) واکشی خدمات قالیشویی — قیمت واحد همیشه از سرور معتبر است.
    // اگر کارگاه مشخص شده باشد، هر قلم باید متعلق به همان کارگاه باشد.
    const services = await this.prisma.laundryService.findMany({
      where: { id: { in: dto.items.map((item) => item.serviceId) } },
      select: { id: true, laundryId: true, unitPrice: true, isActive: true },
    });
    const serviceById = new Map(services.map((service) => [service.id, service]));

    const pricedItems = dto.items.map((item) => {
      const service = serviceById.get(item.serviceId);

      if (!service) {
        throw new NotFoundException(faMessages.order.notFound);
      }

      if (!service.isActive) {
        throw new BadRequestException(
          'یکی از اقلام خدمات انتخابی در حال حاضر فعال نیست',
        );
      }

      if (dto.laundryId && service.laundryId !== dto.laundryId) {
        throw new BadRequestException(
          'یکی از اقلام خدمات متعلق به این کارگاه نیست',
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
    const delivery = dto.deliveryAddress;

    // ۴) ثبت در یک تراکنش: سفارش + اقلام + تاریخچه + پیش‌فاکتور اولیه
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          trackingCode,
          idempotencyKey: dto.idempotencyKey,
          customerId: actor.id,
          laundryId: dto.laundryId,
          status: 'requested',
          province: dto.pickupAddress.province,
          city: dto.pickupAddress.city,
          postalCode: dto.pickupAddress.postalCode,
          fullAddress: dto.pickupAddress.fullAddress,
          latitude: toDecimal(dto.pickupAddress.latitude),
          longitude: toDecimal(dto.pickupAddress.longitude),
          deliveryProvince: delivery?.province,
          deliveryCity: delivery?.city,
          deliveryPostalCode: delivery?.postalCode,
          deliveryFullAddress: delivery?.fullAddress,
          deliveryLatitude: toDecimal(delivery?.latitude),
          deliveryLongitude: toDecimal(delivery?.longitude),
          description: dto.description,
          pickupTimeSlot: dto.pickupTimeSlot,
          totalAmount,
          items: {
            create: pricedItems.map((item) => ({
              serviceId: item.serviceId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              areaSqm: toDecimal(item.areaSqm),
            })),
          },
          statusHistory: {
            create: {
              status: 'requested',
              note: 'ثبت سفارش توسط مشتری',
              actorId: actor.id,
              actorRole: actor.role,
            },
          },
          quotation: {
            create: {
              subtotalAmount: totalAmount,
              deliveryFee: 0,
              taxAmount: 0,
              totalAmount,
              status: 'draft',
            },
          },
        },
        include: { items: true },
      });

      return order;
    });
  }

  /** لیست سفارشات مشتری — فقط سفارش‌های خودش، مرتب بر اساس جدیدترین */
  getCustomerOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  /** یک سفارش مشتری — مالکیت بررسی می‌شود تا دسترسی به سفارش دیگران مسدود شود */
  async getCustomerOrder(customerId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: ORDER_INCLUDE,
    });

    if (!order) throw new NotFoundException(faMessages.order.notFound);

    return order;
  }

  /** تاریخچه تغییرات وضعیت سفارش — فقط صاحب سفارش قابل دسترسی است */
  async getOrderHistory(customerId: string, orderId: string) {
    await this.getCustomerOrder(customerId, orderId);

    return this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * پیگیری عمومی سفارش با کد پیگیری — بدون نیاز به احراز هویت.
   * اطلاعات تماس مشتری برگردانده نمی‌شود.
   */
  async trackByCode(trackingCode: string) {
    const order = await this.prisma.order.findUnique({
      where: { trackingCode: trackingCode.trim().toUpperCase() },
      select: {
        id: true,
        trackingCode: true,
        status: true,
        totalAmount: true,
        currency: true,
        createdAt: true,
        province: true,
        city: true,
        fullAddress: true,
        items: { include: { service: { select: { name: true } } } },
      },
    });

    if (!order) throw new NotFoundException(faMessages.order.notFound);

    return order;
  }

  /**
   * لغو سفارش توسط مشتری — فقط صاحب سفارش و فقط قبل از تحویل.
   * وضعیت به cancelled تغییر کرده و دلیل لغو در تاریخچه لاگ می‌شود.
   */
  async cancelOrder(actor: AuthUser, orderId: string, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true, status: true },
    });

    if (!order) throw new NotFoundException(faMessages.order.notFound);

    if (order.customerId !== actor.id) {
      throw new ForbiddenException(faMessages.common.forbidden);
    }

    const status = this.asFlowStatus(order.status);

    if (!this.stateMachine.isCancellable(status)) {
      throw new BadRequestException(faMessages.order.notCancellable);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' },
        include: ORDER_INCLUDE,
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'cancelled',
          note: reason,
          actorId: actor.id,
          actorRole: actor.role,
        },
      });

      return updated;
    });
  }

  // ───────────────── کارگاه ─────────────────

  /** لیست سفارش‌های کارگاه — فقط سفارش‌های تخصیص‌یافته به این کارگاه */
  getWorkshopOrders(laundryId: string) {
    return this.prisma.order.findMany({
      where: { laundryId },
      orderBy: { createdAt: 'desc' },
      include: ORDER_INCLUDE,
    });
  }

  /**
   * تغییر وضعیت سفارش توسط کارگاه — سفارش باید به این کارگاه تخصیص
   * داشته باشد و انتقال باید برای نقش کارگاه مجاز باشد.
   */
  async updateWorkshopOrderStatus(
    actor: AuthUser,
    laundryId: string,
    orderId: string,
    toStatus: OrderFlowStatus,
    note?: string,
  ) {
    const order = await this.findOrderOrThrow(orderId, {
      laundryId: true,
      status: true,
    });

    if (order.laundryId !== laundryId) {
      throw new ForbiddenException(faMessages.order.notAssignedToWorkshop);
    }

    return this.applyTransition(orderId, order.status, toStatus, actor, note);
  }

  // ───────────────── سفیر ─────────────────

  /** لیست سفارش‌های سفیر — فقط سفارش‌های تخصیص‌یافته به این سفیر */
  getDriverOrders(driverId: string) {
    return this.prisma.order.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
      include: ORDER_INCLUDE,
    });
  }

  /**
   * تغییر وضعیت سفارش توسط سفیر — سفارش باید به این سفیر تخصیص
   * داشته باشد و انتقال باید برای نقش سفیر مجاز باشد.
   */
  async updateDriverOrderStatus(
    actor: AuthUser,
    driverId: string,
    orderId: string,
    toStatus: OrderFlowStatus,
    note?: string,
  ) {
    const order = await this.findOrderOrThrow(orderId, {
      driverId: true,
      status: true,
    });

    if (order.driverId !== driverId) {
      throw new ForbiddenException(faMessages.order.notAssignedToDriver);
    }

    return this.applyTransition(orderId, order.status, toStatus, actor, note);
  }

  // ───────────────── ادمین ─────────────────

  /**
   * لیست سفارش‌ها برای ادمین — فیلتر پیشرفته روی وضعیت، تاریخ،
   * کارگاه، سفیر، مشتری و جستجوی آزاد به اضافهٔ صفحه‌بندی.
   */
  async listOrdersForAdmin(dto: AdminListOrdersDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const where = this.buildAdminWhere(dto);

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: ORDER_INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** جزئیات کامل یک سفارش با همهٔ روابط — فقط ادمین */
  async getOrderForAdmin(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ADMIN_ORDER_INCLUDE,
    });

    if (!order) throw new NotFoundException(faMessages.order.notFound);

    return order;
  }

  /**
   * تغییر وضعیت سفارش توسط ادمین — ادمین می‌تواند هر انتقال مجازی را
   * انجام دهد (override) و محدودیت نقشی برای او اعمال نمی‌شود.
   */
  adminUpdateOrderStatus(
    actor: AuthUser,
    orderId: string,
    toStatus: OrderFlowStatus,
    note?: string,
  ) {
    return this.findOrderOrThrow(orderId, { status: true }).then((order) =>
      this.applyTransition(orderId, order.status, toStatus, actor, note),
    );
  }

  /**
   * تخصیص دستی کارگاه به سفارش — کارگاه قبلی (در صورت وجود) جایگزین می‌شود
   * و این تغییر با یک یادداشت در تاریخچه ثبت می‌شود.
   */
  async assignWorkshop(
    actor: AuthUser,
    orderId: string,
    laundryId: string,
    note?: string,
  ) {
    const laundry = await this.prisma.laundry.findUnique({
      where: { id: laundryId },
      select: { id: true, isActive: true },
    });

    if (!laundry || !laundry.isActive) {
      throw new BadRequestException(faMessages.laundry.notFound);
    }

    const order = await this.findOrderOrThrow(orderId, { status: true });

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { laundryId },
        include: ORDER_INCLUDE,
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: this.asFlowStatus(order.status),
          note: note ?? `تخصیص کارگاه ${laundryId} به سفارش`,
          actorId: actor.id,
          actorRole: actor.role,
        },
      });

      return updated;
    });
  }

  /**
   * تخصیص دستی سفیر به سفارش — یک وظیفه (Assignment) با فاز pickup
   * برای سفیر ساخته و سفیر روی سفارش ثبت می‌شود.
   */
  async assignDriver(
    actor: AuthUser,
    orderId: string,
    driverId: string,
    note?: string,
  ) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: { id: true, isActive: true },
    });

    if (!driver || !driver.isActive) {
      throw new BadRequestException(faMessages.driver.notFound);
    }

    const order = await this.findOrderOrThrow(orderId, { status: true });

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { driverId },
        include: ORDER_INCLUDE,
      });

      // وظیفهٔ برداشت برای سفیر — اگر قبلاً ساخته شده بود، آپدیت می‌شود
      // (یکنتایی روی orderId+phase وجود ندارد، پس دستی بررسی می‌شود)
      const existingAssignment = await tx.assignment.findFirst({
        where: { orderId, phase: 'pickup' },
        select: { id: true },
      });

      if (existingAssignment) {
        await tx.assignment.update({
          where: { id: existingAssignment.id },
          data: { driverId, status: 'pending' },
        });
      } else {
        await tx.assignment.create({
          data: { orderId, driverId, phase: 'pickup', status: 'pending' },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: this.asFlowStatus(order.status),
          note: note ?? `تخصیص سفیر ${driverId} به سفارش`,
          actorId: actor.id,
          actorRole: actor.role,
        },
      });

      return updated;
    });
  }

  /**
   * لغو سفارش توسط ادمین — بر خلاف مشتری، از هر وضعیتی به‌جز
   * مراحل پایانی مجاز است و دلیل آن اجباری است.
   */
  async cancelOrderAdmin(actor: AuthUser, orderId: string, reason: string) {
    const order = await this.findOrderOrThrow(orderId, { status: true });
    const status = this.asFlowStatus(order.status);

    if (!this.stateMachine.isCancellable(status)) {
      throw new BadRequestException(faMessages.order.notCancellable);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' },
        include: ORDER_INCLUDE,
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'cancelled',
          note: reason,
          actorId: actor.id,
          actorRole: actor.role,
        },
      });

      return updated;
    });
  }

  /** آمار کلی سفارش‌ها — تعداد هر وضعیت و مجموع کل */
  async getOrderStats() {
    const grouped = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const total = await this.prisma.order.count();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await this.prisma.order.count({
      where: { createdAt: { gte: todayStart } },
    });

    return {
      total,
      todayCount,
      byStatus: grouped.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
    };
  }

  // ───────────────── رسانه ─────────────────

  /**
   * آپلود تصاویر سفارش — مالکیت سفارش بررسی، فایل‌ها روی S3 و
   * متادیتا در جدول OrderMedia ذخیره می‌شوند.
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

  // ───────────────── ابزارهای داخلی ─────────────────

  /** یافتن سفارش یا پراپ NotFound — select دلخواه فراخواننده را حفظ می‌کند */
  private async findOrderOrThrow<T extends Prisma.OrderSelect>(
    orderId: string,
    select: T,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select,
    });

    if (!order) throw new NotFoundException(faMessages.order.notFound);

    return order as Prisma.OrderGetPayload<{ select: T }>;
  }

  /**
   * اعمال یک انتقال وضعیت — قوانین ماشین وضعیت، نقش مجاز و
   * الزام یادداشت بررسی، سپس آپدیت و لاگ تاریخچه در یک تراکنش.
   *
   * ادمین از محدودیت نقشی معاف است (override) اما «الزام دلیل»
   * برای همهٔ نقش‌ها برقرار است.
   */
  private async applyTransition(
    orderId: string,
    from: string,
    to: OrderFlowStatus,
    actor: AuthUser,
    note?: string,
  ) {
    const flowFrom = this.asFlowStatus(from);
    const explicitRule = this.stateMachine.getTransition(flowFrom, to);
    const rule = explicitRule ?? this.adminOverrideRule(actor, flowFrom, to);

    if (!rule) {
      throw new BadRequestException(faMessages.order.invalidTransition);
    }

    if (actor.role !== 'admin' && !rule.roles.includes(actor.role)) {
      throw new ForbiddenException(faMessages.common.forbidden);
    }

    // برای override ادمین (خارج از قوانین معمول) دلیل اجباری است
    const requiresNote = rule.requiresNote || (explicitRule === null);

    if (requiresNote && !note?.trim()) {
      throw new BadRequestException(faMessages.order.reasonRequired);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: to },
        include: ORDER_INCLUDE,
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: to,
          note,
          actorId: actor.id,
          actorRole: actor.role,
        },
      });

      return updated;
    });
  }

  /**
   * قانون انتقال برای override ادمین — ادمین می‌تواند هر انتقال
   * مجازی را انجام دهد، اما لغو مسیر مجزا دارد و نیاز به دلیل دارد.
   */
  private adminOverrideRule(
    actor: AuthUser,
    from: OrderFlowStatus,
    to: OrderFlowStatus,
  ): TransitionRule | null {
    if (actor.role !== 'admin') return null;
    if (to === from || from === 'cancelled') return null;
    // لغو فقط از مسیر اختصاصی cancel قابل انجام است
    if (to === 'cancelled') return null;

    return { roles: ['admin'], requiresNote: true };
  }

  /**
   * تبدیل وضعیت ذخیره‌شده به جریان فعلی —
   * وضعیت‌های جریان قدیمی هم نرمال می‌شوند تا ردیف‌های قدیمی دیتابیس
   * بدون خطا کار کنند.
   */
  private asFlowStatus(status: string): OrderFlowStatus {
    const flowStatus = toFlowStatus(status);
    if (!flowStatus) {
      throw new BadRequestException(faMessages.order.invalidStatus);
    }

    return flowStatus;
  }

  /** ساخت شرط WHERE لیست ادمین از DTO فیلتر */
  private buildAdminWhere(dto: AdminListOrdersDto): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {};

    if (dto.status) where.status = dto.status;
    if (dto.laundryId) where.laundryId = dto.laundryId;
    if (dto.driverId) where.driverId = dto.driverId;
    if (dto.customerId) where.customerId = dto.customerId;

    if (dto.dateFrom || dto.dateTo) {
      where.createdAt = {
        gte: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
        lte: dto.dateTo ? new Date(dto.dateTo) : undefined,
      };
    }

    if (dto.search) {
      where.OR = [
        { trackingCode: { contains: dto.search, mode: 'insensitive' } },
        {
          customer: {
            fullName: { contains: dto.search, mode: 'insensitive' },
          },
        },
      ];
    }

    return where;
  }

  /** تولید کد پیگیری تصادفی و یکتا — YUMA-XXXXXX */
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

/** تبدیل عدد اختیاری به Prisma.Decimal — undefined به undefined تبدیل می‌شود */
function toDecimal(value?: number): Prisma.Decimal | undefined {
  return value === undefined ? undefined : new Prisma.Decimal(value);
}
