import { Injectable } from '@nestjs/common';
import { isOrderFlowStatus, type OrderFlowStatus } from '@yuma/types';

/**
 * جریان اصلی وضعیت‌های سفارش — مسیر خطی عملیات قالیشویی.
 * `cancelled` جزو این مسیر نیست و قوانین مجزایی دارد.
 */
const FLOW: readonly OrderFlowStatus[] = [
  'requested', // ثبت‌شده توسط مشتری
  'awaiting_confirmation', // در انتظار تأیید کارگاه
  'awaiting_pickup', // تأیید شد، در انتظار سفیر
  'picked_up', // سفیر از مشتری تحویل گرفت
  'awaiting_assessment', // در کارگاه، در انتظار ارزیابی
  'quoted', // برآورد قیمت ارسال شد
  'quote_approved', // مشتری برآورد را تأیید کرد
  'in_cleaning', // در حال شستشو
  'quality_control', // کنترل کیفیت
  'ready_for_delivery', // آماده تحویل
  'out_for_delivery', // در مسیر تحویل
  'delivered', // تحویل شد
  'closed', // بسته شد
];

/**
 * قوانین هر انتقال وضعیت — چه نقش‌هایی مجازند و آیا دلیل اجباری است
 *
 * نقش `admin` در همه انتقال‌ها مجاز است (override) و در کلیدها نیازی به
 * ذکر آن نیست؛ سرویس فراخواننده این مورد را جداگانه بررسی می‌کند.
 */
export interface TransitionRule {
  /** نقش‌هایی که می‌توانند این انتقال را انجام دهند (بدون admin) */
  roles: string[];
  /** آیا ذکر دلیل برای این انتقال اجباری است؟ */
  requiresNote: boolean;
}

/** جدول انتقال‌های مجاز — کلید: `from->to` */
const TRANSITIONS: Readonly<Record<string, TransitionRule>> = {
  // کارگاه سفارش را تأیید می‌کند
  'requested->awaiting_confirmation': {
    roles: ['laundry_manager', 'laundry_user'],
    requiresNote: false,
  },
  // کارگاه آمادهی برداشت را تأیید می‌کند
  'awaiting_confirmation->awaiting_pickup': {
    roles: ['laundry_manager', 'laundry_user'],
    requiresNote: false,
  },
  // سفیر فرش را از مشتری تحویل می‌گیرد
  'awaiting_pickup->picked_up': { roles: ['driver'], requiresNote: false },
  // فرش به کارگاه رسید و ارزیابی می‌شود
  'picked_up->awaiting_assessment': {
    roles: ['laundry_manager', 'laundry_user'],
    requiresNote: false,
  },
  // کارگاه برآورد قیمت را ارسال می‌کند — دلیل (جزییات قیمت) اجباری است
  'awaiting_assessment->quoted': {
    roles: ['laundry_manager', 'laundry_user'],
    requiresNote: true,
  },
  // مشتری برآورد را تأیید می‌کند
  'quoted->quote_approved': { roles: ['customer'], requiresNote: false },
  // کارگاه شستشو را شروع می‌کند
  'quote_approved->in_cleaning': {
    roles: ['laundry_manager', 'laundry_user'],
    requiresNote: false,
  },
  // شستشو تمام شد، کنترل کیفیت شروع می‌شود
  'in_cleaning->quality_control': {
    roles: ['laundry_manager', 'laundry_user'],
    requiresNote: false,
  },
  // کنترل کیفیت قبول شد، آماده تحویل است
  'quality_control->ready_for_delivery': {
    roles: ['laundry_manager', 'laundry_user'],
    requiresNote: false,
  },
  // سفیر فرش را برای تحویل به راه می‌اندازد
  'ready_for_delivery->out_for_delivery': { roles: ['driver'], requiresNote: false },
  // تحویل به مشتری انجام شد
  'out_for_delivery->delivered': { roles: ['driver'], requiresNote: false },
  // ادمین سفارش را می‌بندد — دلیل اجباری است
  'delivered->closed': { roles: [], requiresNote: true },
};

/**
 * ماشین وضعیت سفارش — انتقال مجاز بین وضعیت‌ها، نقش مجاز و
 * الزام یادداشت را تعیین می‌کند.
 *
 * جریان اصلی خطی است: هر وضعیت فقط به وضعیت بعدی خود می‌رود.
 * لغو از هر وضعیتی به‌جز `delivered` و `closed` مجاز است و خودش یک
 * وضعیت پایانی است. ادمین می‌تواند هر انتقالی را انجام دهد (override).
 *
 * ورودی‌ها برابر جریان قدیمی (`OrderStatus` در دیتابیس) را هم می‌پذیرند
 * تا ماژول‌های pricing/payments/assignments که هنوز مهاجرت نکرده‌اند
 * بدون تغییر با این ماشین کار کنند.
 */
@Injectable()
export class OrderStateMachine {
  /** آیا انتقال از یک وضعیت به دیگری مجاز است؟ */
  canTransition(
    from: OrderFlowStatus | string,
    to: OrderFlowStatus | string,
  ): boolean {
    const flowFrom = toFlowStatus(from);
    const flowTo = toFlowStatus(to);

    if (!flowFrom || !flowTo) return false;

    // انتقال به وضعیت فعلی مجاز نیست
    if (flowTo === flowFrom) return false;

    // لغو از هر جا به‌جز مراحل پایانی مجاز است
    if (flowTo === 'cancelled') return this.isCancellable(flowFrom);

    // سفارش لغوشده دیگر تغییری نمی‌کند
    if (flowFrom === 'cancelled') return false;

    // در جریان اصلی فقط پرش به وضعیت بعدی مجاز است
    return this.nextStatus(flowFrom) === flowTo;
  }

  /** وضعیت بعدی مجاز در جریان اصلی — null یعنی وضعیت پایانی */
  nextStatus(status: OrderFlowStatus): OrderFlowStatus | null {
    const index = FLOW.indexOf(status);
    if (index === -1 || index === FLOW.length - 1) return null;

    return FLOW[index + 1] as OrderFlowStatus;
  }

  /** قوانین یک انتقال — null یعنی انتقال مجاز نیست */
  getTransition(
    from: OrderFlowStatus | string,
    to: OrderFlowStatus | string,
  ): TransitionRule | null {
    const flowFrom = toFlowStatus(from);
    const flowTo = toFlowStatus(to);

    if (!flowFrom || !flowTo) return null;

    return TRANSITIONS[`${flowFrom}->${flowTo}`] ?? null;
  }

  /** آیا این نقش می‌تواند این انتقال را انجام دهد؟ (admin همیشه مجاز است) */
  canRoleTransition(
    from: OrderFlowStatus | string,
    to: OrderFlowStatus | string,
    role: string,
  ): boolean {
    const rule = this.getTransition(from, to);
    if (!rule) return false;

    return role === 'admin' || rule.roles.includes(role);
  }

  /** آیا سفارش در این وضعیت قابل لغو است؟ — از هر جا به‌جز delivered/closed */
  isCancellable(status: OrderFlowStatus | string): boolean {
    const flowStatus = toFlowStatus(status);
    if (!flowStatus) return false;

    return (
      flowStatus !== 'delivered' &&
      flowStatus !== 'closed' &&
      flowStatus !== 'cancelled'
    );
  }

  /** آیا وضعیت پایانی است — دیگر انتقالی وجود ندارد */
  isTerminal(status: OrderFlowStatus | string): boolean {
    const flowStatus = toFlowStatus(status);
    if (!flowStatus) return false;

    return flowStatus === 'closed' || flowStatus === 'cancelled';
  }
}

/**
 * نگاشت وضعیت‌های جریان قدیمی به جریان فعلی —
 * برای ماژول‌هایی که هنوز از مقادیر legacy استفاده می‌کنند.
 */
const LEGACY_TO_FLOW: Readonly<Record<string, OrderFlowStatus>> = {
  pending: 'requested',
  assigned: 'awaiting_pickup',
  at_laundry: 'awaiting_assessment',
  quotation_sent: 'quoted',
  quotation_approved: 'quote_approved',
  washing: 'in_cleaning',
  quality_check: 'quality_control',
  ready: 'ready_for_delivery',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
};

/**
 * تبدیل هر وضعیت (جریان فعلی یا قدیمی) به وضعیت جریان فعلی —
 * `null` یعنی مقدار اصلاً شناخته نیست. این تابع به ماژول‌های دیگر هم
 * اجازه می‌دهد بدون دانستن جزئیات جریان، وضعیت را نرمال کنند.
 */
export function toFlowStatus(status: string): OrderFlowStatus | null {
  if (isOrderFlowStatus(status)) return status;

  return LEGACY_TO_FLOW[status] ?? null;
}
