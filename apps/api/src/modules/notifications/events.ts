import type { OrderFlowStatus } from '@yuma/types';

/**
 * رویدادهای انتشارشده در سراسر برنامه که ماژول اعلان‌ها به آن‌ها گوش می‌دهد.
 * این اینترفیس‌ها فقط نوع داده هستند و توسط فرستندهٔ رویداد (orders/payments/otp)
 * به‌عنوان payload ارسال می‌شوند.
 */

/** تغییر وضعیت سفارش — بعد از commit تراکنش منتشر می‌شود */
export interface OrderStatusChangedEvent {
  orderId: string;
  trackingCode: string;
  customerId: string;
  /** وضعیت قبلی — برای جلوگیری از ارسال تکراری */
  from: OrderFlowStatus | null;
  /** وضعیت جدید */
  to: OrderFlowStatus;
  /** شناسهٔ عامل تغییر — کاربر یا سیستم */
  actorId: string;
  actorRole: string;
}

/** تأیید موفق پرداخت */
export interface PaymentCapturedEvent {
  paymentId: string;
  orderId: string;
  trackingCode: string;
  customerId: string;
  /** مبلغ به ریال */
  amount: number;
  referenceId: string | null;
}

/** شکست پرداخت */
export interface PaymentFailedEvent {
  paymentId: string;
  orderId: string;
  trackingCode: string;
  customerId: string;
  amount: number;
  /** دلیل شکست — از طرف درگاه */
  reason: string | null;
}

/** درخواست کد تأیید یکبار مصرف */
export interface OtpRequestedEvent {
  mobile: string;
  code: string;
}
