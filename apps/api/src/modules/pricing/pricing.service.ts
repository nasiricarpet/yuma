import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { faMessages } from '../../common/messages.fa';
import { OrderStateMachine } from '../orders/state-machine/order-state-machine';
import { CreateQuotationDto } from './dto/create-quotation.dto';

/**
 * سرویس قیمت‌گذاری — مدیریت پیش‌فاکتور (Quotation) سفارش‌ها
 *
 * فرآیند: کارگاه پیش‌فاکتور را ثبت و ارسال می‌کند،
 * مشتری آن را تأیید یا رد می‌کند. مبالغ به ریال (IRR) و عدد صحیح هستند.
 *
 * هر تغییر وضعیت سفارش در یک تراکنش همراه با لاگ تاریخچه انجام می‌شود.
 */
@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: OrderStateMachine,
  ) {}

  /**
   * ثبت و ارسال پیش‌فاکتور توسط کارگاه —
   * سفارش باید متعلق به این کارگاه باشد و در وضعیت قبل از quotation_sent.
   * در یک تراکنش: محاسبه جمع کل، ساخت Quotation و
   * انتقال سفارش به quotation_sent
   */
  async createQuotation(orderId: string, laundryId: string, dto: CreateQuotationDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { laundryId: true, status: true, quotation: true },
    });

    if (!order) throw new NotFoundException(faMessages.order.notFound);

    // فقط کارگاه صاحب سفارش می‌تواند پیش‌فاکتور بزند
    if (order.laundryId !== laundryId) {
      throw new ForbiddenException(faMessages.common.forbidden);
    }

    // برای هر سفارش فقط یک پیش‌فاکتور قابل ثبت است
    if (order.quotation) {
      throw new BadRequestException(faMessages.quotation.exists);
    }

    // ماشین وضعیت اجازه ارسال پیش‌فاکتور را می‌دهد؟
    if (!this.stateMachine.canTransition(order.status, 'quotation_sent')) {
      throw new BadRequestException(faMessages.order.invalidTransition);
    }

    // جمع کل از مبالغ ارسالی — ریال
    const totalAmount = dto.subtotalAmount + dto.deliveryFee + dto.taxAmount;

    return this.prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.create({
        data: {
          orderId,
          subtotalAmount: dto.subtotalAmount,
          deliveryFee: dto.deliveryFee,
          taxAmount: dto.taxAmount,
          totalAmount,
          status: 'sent',
        },
      });

      // انتقال سفارش به quotation_sent و لاگ تاریخچه
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'quotation_sent' },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'quotation_sent',
          actorId: laundryId,
          actorRole: 'laundry_manager',
          note: 'ارسال پیش‌فاکتور به مشتری',
        },
      });

      return quotation;
    });
  }

  /**
   * تأیید پیش‌فاکتور توسط مشتری —
   * فقط صاحب سفارش و وقتی پیش‌فاکتور در وضعیت sent است مجاز است.
   * در یک تراکنش: quotation به approved، totalAmount سفارش آپدیت و
   * سفارش به quotation_approved منتقل می‌شود
   */
  async approveQuotation(orderId: string, customerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true, status: true, quotation: true },
    });

    if (!order) throw new NotFoundException(faMessages.order.notFound);

    // فقط صاحب سفارش می‌تواند پیش‌فاکتور را تأیید کند
    if (order.customerId !== customerId) {
      throw new ForbiddenException(faMessages.common.forbidden);
    }

    // پیش‌فاکتوری برای این سفارش وجود دارد؟
    const quotation = order.quotation;
    if (!quotation) throw new NotFoundException(faMessages.quotation.notFound);

    // فقط پیش‌فاکتور ارسال‌شده قابل تأیید است
    if (quotation.status !== 'sent') {
      throw new BadRequestException(faMessages.quotation.notSent);
    }

    // ماشین وضعیت اجازه این انتقال را می‌دهد؟
    if (!this.stateMachine.canTransition(order.status, 'quotation_approved')) {
      throw new BadRequestException(faMessages.order.invalidTransition);
    }

    return this.prisma.$transaction(async (tx) => {
      const approved = await tx.quotation.update({
        where: { orderId },
        data: { status: 'approved' },
      });

      // مبلغ نهایی سفارش از پیش‌فاکتور تأییدشده می‌آید
      await tx.order.update({
        where: { id: orderId },
        data: { totalAmount: approved.totalAmount, status: 'quotation_approved' },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'quotation_approved',
          actorId: customerId,
          actorRole: 'customer',
          note: 'تأیید پیش‌فاکتور توسط مشتری',
        },
      });

      return approved;
    });
  }

  /** دریافت پیش‌فاکتور یک سفارش — در صورت عدم وجود NotFoundException */
  async getQuotationByOrder(orderId: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { orderId },
    });

    if (!quotation) throw new NotFoundException(faMessages.quotation.notFound);

    return quotation;
  }
}
