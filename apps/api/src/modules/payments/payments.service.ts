import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { faMessages } from '../../common/messages.fa';
import { OrderStateMachine } from '../orders/state-machine/order-state-machine';
import { ZarinpalService } from '../../shared/payment/zarinpal.service';

/**
 * سرویس پرداخت — آغاز تراکنش و تأیید کال‌بک درگاه زرین‌پال
 *
 * جریان: مشتری پس از تأیید پیش‌فاکتور، پرداخت را آغاز می‌کند،
 * به درگاه هدایت شده و پس از بازگشت، کال‌بک به‌صورت عمومی تأیید می‌شود.
 * مبالغ به ریال (IRR) ذخیره می‌شوند.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly zarinpal: ZarinpalService,
    private readonly stateMachine: OrderStateMachine,
  ) {}

  /**
   * آغاز پرداخت — سفارش باید در وضعیت quotation_approved باشد.
   * مبلغ از totalAmount سفارش خوانده شده، یک رکورد Payment ساخته،
   * لینک درگاه گرفته و authority در دیتابیس ذخیره می‌شود
   */
  async initiatePayment(orderId: string, customerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true, status: true, totalAmount: true },
    });

    if (!order) throw new NotFoundException(faMessages.order.notFound);

    // فقط صاحب سفارش می‌تواند پرداخت را آغاز کند
    if (order.customerId !== customerId) {
      throw new ForbiddenException(faMessages.common.forbidden);
    }

    // ماشین وضعیت باید اجازه ورود به مرحله washing را بدهد
    if (!this.stateMachine.canTransition(order.status, 'washing')) {
      throw new BadRequestException(faMessages.order.invalidTransition);
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        customerId,
        amount: order.totalAmount,
        status: 'pending',
      },
    });

    // درخواست به درگاه — مبلغ و کال‌بک ارسال می‌شود
    const { authority, paymentUrl } = await this.zarinpal.requestPayment(
      payment.amount,
      `پرداخت سفارش ${orderId}`,
      this.zarinpal.getCallbackUrl(),
    );

    // ذخیره authority برای تطبیق در کال‌بک
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { authority },
    });

    this.logger.log(`پرداخت آغاز شد — paymentId: ${payment.id} | order: ${orderId}`);

    return {
      paymentId: payment.id,
      authority,
      paymentUrl,
    };
  }

  /**
   * تأیید کال‌بک درگاه — مسیر عمومی، بدون توکن.
   * پرداخت با authority پیدا شده، وریفای می‌شود و در صورت موفقیت،
   * وضعیت سفارش در یک تراکنش اتمیک به washing منتقل می‌شود
   */
  async verifyCallback(authority: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { authority },
      include: { order: { select: { status: true } } },
    });

    if (!payment) throw new NotFoundException(faMessages.payment.notFound);

    // جلوگیری از پردازش مجدد یک تراکنش
    if (payment.status === 'success') {
      throw new BadRequestException(faMessages.payment.alreadyProcessed);
    }

    // وریفای توسط درگاه
    const result = await this.zarinpal.verifyPayment(payment.amount, authority);

    // پرداخت ناموفق — وضعیت failed و خطا
    if (!result.verified) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });

      throw new BadRequestException(faMessages.payment.verifyFailed);
    }

    // انتقال سفارش به washing باید مجاز باشد
    if (!this.stateMachine.canTransition(payment.order.status, 'washing')) {
      throw new BadRequestException(faMessages.order.invalidTransition);
    }

    // تراکنش اتمیک: موفقیت پرداخت + کد پیگیری + انتقال سفارش به washing
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'success', referenceId: result.referenceId },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'washing' },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: 'washing',
          actorId: payment.customerId,
          actorRole: 'customer',
          note: `پرداخت موفق — کد پیگیری ${result.referenceId}`,
        },
      });

      this.logger.log(
        `پرداخت تأیید شد — paymentId: ${payment.id} | کد پیگیری: ${result.referenceId}`,
      );

      return updated;
    });
  }
}
