import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { OrderFlowStatus } from '@yuma/types';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationService } from '../notification.service';
import { OrderStatusChangedEvent } from '../events';

/**
 * نگاشت وضعیت سفارش به کد قالب پیامک
 *
 * فقط وضعیت‌های کلیدی مسیر سفارش پیامک دارند؛ وضعیت‌های میانی مثل
 * awaiting_confirmation عمداً پیامک نمی‌فرستند تا مشتری اسپم نشود.
 */
const STATUS_TEMPLATES = new Map<OrderFlowStatus, string>([
  ['requested', 'order_requested'],
  ['picked_up', 'order_picked_up'],
  ['quoted', 'quotation_sent'],
  ['in_cleaning', 'order_in_cleaning'],
  ['ready_for_delivery', 'order_ready'],
  ['delivered', 'order_delivered'],
]);

/**
 * Listener رویداد `order.status_changed`
 *
 * بعد از commit شدن تغییر وضعیت سفارش، پیامک متناظر را برای مشتری
 * ارسال می‌کند. ارسال پیامک در یک بلاک try/catch انجام می‌شود تا
 * خرابی سامانه پیامک هرگز روی جریان سفارش اثر نگذارد.
 */
@Injectable()
export class OrderNotificationListener {
  private readonly logger = new Logger(OrderNotificationListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  @OnEvent('order.status_changed')
  async handleStatusChanged(payload: OrderStatusChangedEvent): Promise<void> {
    const template = STATUS_TEMPLATES.get(payload.to);
    if (!template) return;

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: payload.orderId },
        include: { customer: { select: { mobile: true, fullName: true } } },
      });

      if (!order?.customer?.mobile) {
        this.logger.warn(
          `شماره موبایل مشتری موجود نیست — orderId: ${payload.orderId}`,
        );
        return;
      }

      await this.notifications.send(
        order.customer.mobile,
        template,
        {
          trackingCode: order.trackingCode,
          customerName: order.customer.fullName ?? '',
        },
        { userId: order.customerId, orderId: order.id },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `خطا در ارسال پیامک تغییر وضعیت سفارش — orderId: ${payload.orderId} | ${message}`,
      );
    }
  }
}
