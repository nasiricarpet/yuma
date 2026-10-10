/**
 * انواع مربوط به ارزیابی و کنترل کیفیت در پنل قالیشویی
 *
 * این مدل‌ها قرارداد رابط کاربری هستند؛ endpoints مربوطه در
 * `lib/api/endpoints/orders.ts` آن‌ها را به API می‌فرستند.
 * در زمان توسعه، داده‌های نمونه (mock) از همان شکل استفاده می‌کنند.
 */

/** نوع فرش — مبنای قیمت‌گذاری خودکار */
export type RugType =
  | 'persian_silk'
  | 'persian_wool'
  | 'tabriz'
  | 'kashan'
  | 'ghashghaei'
  | 'kilim'
  | 'machine';

export const RUG_TYPE_LABELS: Record<RugType, string> = {
  persian_silk: 'فرش دستبافت ابریشم',
  persian_wool: 'فرش دستبافت پشمی',
  tabriz: 'فرش تبریز',
  kashan: 'فرش کاشان',
  ghashghaei: 'فرش قشقایی',
  kilim: 'گیله',
  machine: 'فرش ماشینی',
};

/** سرویس‌های قابل انتخاب برای هر فرش */
export type RugService = 'wash' | 'deep_wash' | 'stain_removal' | 'repair' | 'edge_binding';

export const RUG_SERVICE_LABELS: Record<RugService, string> = {
  wash: 'شستشوی معمولی',
  deep_wash: 'شستشوی عمیق',
  stain_removal: 'پاکسازی لکه',
  repair: 'ترمیم',
  edge_binding: 'حاشیه‌دوزی',
};

/** نوع آسیب شناخته‌شده در فرش */
export type DamageType = 'tear' | 'burn' | 'moth' | 'color_fade' | 'water_damage' | 'other';

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  tear: 'پارگی',
  burn: 'سوختگی',
  moth: 'آفت موش',
  color_fade: 'ت رنگ',
  water_damage: 'آسیب آب',
  other: 'سایر',
};

/** نوع لکه */
export type StainType = 'oil' | 'food' | 'blood' | 'ink' | 'urine' | 'paint' | 'other';

export const STAIN_TYPE_LABELS: Record<StainType, string> = {
  oil: 'چربی',
  food: 'غذا',
  blood: 'خون',
  ink: 'جوهر',
  urine: 'ادرار',
  paint: 'رنگ',
  other: 'سایر',
};

/** شدت لکه — ۱ (خفیف) تا ۳ (شدید) */
export type StainSeverity = 1 | 2 | 3;

export const STAIN_SEVERITY_LABELS: Record<StainSeverity, string> = {
  1: 'خفیف',
  2: 'متوسط',
  3: 'شدید',
};

/**
 * یک قلم از سفارش در زمان ارزیابی — هر فرش به‌صورت مجزا بررسی می‌شود.
 */
export interface AssessmentItem {
  /** شناسه آیتم موجود در دیتابیس، یا شناسه موقت برای آیتم جدید */
  id: string;
  /** نوع فرش — مبنای نرخ قیمت‌گذاری */
  rugType: RugType;
  /** متراژ فرش به متر مربع */
  areaSqm: number;
  /** سرویس‌های انتخاب‌شده برای این فرش */
  services: RugService[];
  /** آسیب‌های ثبت‌شده — خالی یعنی بدون آسیب */
  damages: AssessmentDamage[];
  /** لکه‌های ثبت‌شده — خالی یعنی بدون لکه */
  stains: AssessmentStain[];
  /** قیمت نهایی این قلم به ریال — از pricing_rules محاسبه، قابل ویرایش کارشناس */
  price: number;
  /** یادداشت داخلی قالیشویی — برای مشتری ارسال نمی‌شود */
  note?: string;
}

export interface AssessmentDamage {
  type: DamageType;
  description?: string;
}

export interface AssessmentStain {
  type: StainType;
  severity: StainSeverity;
}

/**
 * وضعیت ذخیره ارزیابی — پیش‌نویس یا ارسال‌شده به مشتری
 */
export type AssessmentStatus = 'draft' | 'submitted';

/**
 * ارزیابی کامل یک سفارش
 */
export interface Assessment {
  orderId: string;
  /** کد پیگیری سفارش — در header صفحه نمایش داده می‌شود */
  trackingCode: string;
  /** نام مشتری — در header صفحه نمایش داده می‌شود */
  customerName: string;
  status: AssessmentStatus;
  items: AssessmentItem[];
  /** درصد تخفیف — در sidebar محاسبه می‌شود */
  discountPercent: number;
  /** مبلغ تخفیف به ریال */
  discountAmount: number;
  /** جمع کل اقلام قبل از تخفیف (ریال) */
  subtotal: number;
  /** مبلغ نهایی پس از تخفیف (ریال) */
  total: number;
  /** زمان ایجاد/به‌روزرسانی ارزیابی */
  updatedAt?: string;
}

/**
 * یک ردیف از لیست ارزیابی — فقط فیلدهای لازم برای جدول
 */
export interface AssessmentListRow {
  orderId: string;
  trackingCode: string;
  customerName: string;
  /** تعداد اقلام (فرش‌ها) */
  itemCount: number;
  /** زمان ورود سفارش به کارگاه — مبنای «زمان انتظار» */
  arrivedAt: string;
  /** شماره موبایل مشتری برای نمایش */
  customerMobile?: string;
}

/** فیلتر زمان انتظار در لیست ارزیابی */
export type WaitingTimeFilter = 'all' | 'under_24h' | '24_to_72h' | 'over_72h';

export const WAITING_TIME_FILTER_LABELS: Record<WaitingTimeFilter, string> = {
  all: 'همه',
  under_24h: 'زیر ۲۴ ساعت',
  '24_to_72h': '۲۴ تا ۷۲ ساعت',
  over_72h: 'بیش از ۷۲ ساعت',
};

/**
 * پاسخ لیست ارزیابی‌ها
 */
export interface AssessmentListResponse {
  rows: AssessmentListRow[];
  total: number;
}

/**
 * قاعده قیمت‌گذاری — نرخ هر متر مربع برای ترکیب نوع فرش و سرویس.
 *
 * قیمت خودکار هر قلم = Σ(نرخ سرویس × متراژ). کارشناس می‌تواند نتیجه را
 * دستی تغییر دهد.
 */
export interface PricingRule {
  rugType: RugType;
  service: RugService;
  /** نرخ به ازای هر متر مربع (ریال) */
  ratePerSqm: number;
}

/**
 * --- کنترل کیفیت ---
 */

/** سوالات چک‌لیست کنترل کیفیت — ترتیب نمایش */
export const QC_CHECKLIST_KEYS = [
  'color_intact',
  'texture_intact',
  'stain_removed',
  'damage_repaired',
  'no_odor',
  'packaging_ok',
] as const;

export type QCChecklistKey = (typeof QC_CHECKLIST_KEYS)[number];

export const QC_CHECKLIST_LABELS: Record<QCChecklistKey, string> = {
  color_intact: 'رنگ بدون تغییر؟',
  texture_intact: 'بافت سالم؟',
  stain_removed: 'لکه پاک شده؟',
  damage_repaired: 'آسیب ترمیم شده؟',
  no_odor: 'بوی نامطبوع ندارد؟',
  packaging_ok: 'بسته‌بندی مناسب؟',
};

/** پاسخ به هر سوال چک‌لیست */
export type QCAnswer = 'pass' | 'fail';

export interface QCChecklistEntry {
  key: QCChecklistKey;
  answer: QCAnswer;
  note?: string;
}

/**
 * نتیجه تصمیم کنترل کیفیت:
 * - pass → سفارش به ready_for_delivery منتقل می‌شود
 * - fail → سفارش به in_cleaning برمی‌گردد با ذکر دلیل
 */
export type QCDecision = 'pass' | 'fail';

export interface QCSubmission {
  orderId: string;
  decision: QCDecision;
  checklist: QCChecklistEntry[];
  /** در صورت fail — دلیل بازگرداندن به in_cleaning */
  failReason?: string;
  /** شناسه تصاویر آپلودشده پس از کنترل کیفیت */
  mediaIds: string[];
}

/**
 * مدیای ثبت‌شده برای یک سفارش
 */
export interface OrderMedia {
  id: string;
  url: string;
  fileName: string;
}
