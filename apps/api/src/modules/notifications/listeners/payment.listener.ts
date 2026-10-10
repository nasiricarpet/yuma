import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationService } from '../notification.service';
import { PaymentCapturedEvent, PaymentFailedEvent } from '../events';

/**
 * Listener رویدادهای پرداخت
 *
 *  - `payment.captured` → پیامک تأیید پرداخت (`payment_success`)
 *  - `payment.failed`    → پیامک شکست پرداخت (`payment_failed`)
 *
 * این رویدادها بعد از commit تراکنش پرداخت منتشر می‌شوند، بنابراین
 * خرابی سامانه پیامک روی وضعیت پرداخت اثر ندارد.
 */
@Injectable()
export class PaymentNotificationListener {
  private readonly logger = new Logger(PaymentNotificationListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  @OnEvent('payment.captured')
  async handleCaptured(payload: PaymentCapturedEvent): Promise<void> {
    await this.sendOrderSms(payload.orderId, 'payment_success', {
      trackingCode: payload.trackingCode,
      amount: formatToman(payload.amount),
      referenceId: payload.referenceId ?? '',
    });
  }

  @OnEvent('payment.failed')
  async handleFailed(payload: PaymentFailedEvent): Promise<void> {
    await this.sendOrderSms(payload.orderId, 'payment_failed', {
      trackingCode: payload.trackingCode,
      amount: formatToman(payload.amount),
      reason: payload.reason ?? '',
    });
  }

  /** مشتری سفارش را پیدا کرده و پیامک را ارسال می‌کند */
  private async sendOrderSms(
    orderId: string,
    template: string,
    data: Record<string, string | number>,
  ): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: { select: { mobile: true } } },
      });

      if (!order?.customer?.mobile) {
        this.logger.warn(
          `شماره موبایل مشتری موجود نیست — orderId: ${orderId}`,
        );
        return;
      }

      await this.notifications.send(order.customer.mobile, template, data, {
        userId: order.customerId,
        orderId: order.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `خطا در ارسال پیامک پرداخت — orderId: ${orderId} | ${message}`,
      );
    }
  }
}

/** تبدیل ریال به نمایش فارسی تومان — مثلاً ۱۲۵۰۰۰۰ ریال → ۱۲۵٬۰۰۰ تومان */
function formatToman(rial: number): string {
  return Number(rial / 10).toLocaleString('fa-IR');
}
