import { Injectable } from '@nestjs/common';
import type { OrderStatus } from '@yuma/types';

/**
 * جریان اصلی وضعیت‌های سفارش — مسیر خطی عملیات خشکشویی
 * لغو (cancelled) در این مسیر نیست و قوانین مجزایی دارد
 */
const FLOW: readonly OrderStatus[] = [
  'pending', // ثبت‌شده
  'assigned', // تخصیص‌یافته به سفیر
  'picked_up', // از مشتری گرفته شد
  'at_laundry', // در قالیشویی
  'quotation_sent', // برآورد ارسال شد
  'quotation_approved', // مشتری تأیید کرد
  'washing', // شستشو
  'quality_check', // کنترل کیفیت
  'ready', // آماده تحویل
  'out_for_delivery', // در مسیر تحویل
  'delivered', // تحویل شد
];

/**
 * ماشین وضعیت سفارش — انتقال مجاز بین وضعیت‌ها را تعیین می‌کند
 *
 * جریان اصلی خطی است: هر وضعیت فقط به وضعیت بعدی خود می‌رود.
 * لغو فقط قبل از شروع شستشو مجاز است و خودش یک وضعیت پایانی است.
 */
@Injectable()
export class OrderStateMachine {
  /** اندیس شروع شستشو — لغو فقط قبل از این مرحله مجاز است */
  private readonly washingIndex = FLOW.indexOf('washing');

  /** آیا انتقال از یک وضعیت به دیگری مجاز است؟ */
  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    // انتقال به وضعیت فعلی مجاز نیست
    if (to === from) return false;

    // لغو فقط قبل از شستشو مجاز است
    if (to === 'cancelled') return this.isCancellable(from);

    // سفارش لغوشده دیگر تغییری نمی‌کند
    if (from === 'cancelled') return false;

    // در جریان اصلی فقط پرش به وضعیت بعدی مجاز است
    return this.nextStatus(from) === to;
  }

  /** وضعیت بعدی مجاز در جریان اصلی — null یعنی وضعیت پایانی */
  nextStatus(status: OrderStatus): OrderStatus | null {
    const index = FLOW.indexOf(status);
    if (index === -1 || index === FLOW.length - 1) return null;

    return FLOW[index + 1] as OrderStatus;
  }

  /** آیا سفارش در این وضعیت قابل لغو است؟ — فقط قبل از شروع شستشو */
  isCancellable(status: OrderStatus): boolean {
    const index = FLOW.indexOf(status);
    return index !== -1 && index < this.washingIndex;
  }

  /** آیا وضعیت پایانی است — دیگر انتقالی وجود ندارد */
  isTerminal(status: OrderStatus): boolean {
    return status === 'cancelled' || status === 'delivered';
  }
}
