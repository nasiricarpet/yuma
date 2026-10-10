import type {
  AssessmentItem,
  PricingRule,
  RugService,
  RugType,
} from './types';

/**
 * قواعد قیمت‌گذاری قالیشویی — نرخ هر متر مربع به ریال.
 *
 * این جدول معادل `pricing_rules` در دیتابیس است. در توسعه از همین مقادیر
 * نمونه استفاده می‌شود؛ در تولید از endpoint قیمت‌گذاری خوانده می‌شود.
 */
export const DEFAULT_PRICING_RULES: PricingRule[] = [
  // شستشوی معمولی
  { rugType: 'persian_silk', service: 'wash', ratePerSqm: 320_000 },
  { rugType: 'persian_wool', service: 'wash', ratePerSqm: 180_000 },
  { rugType: 'tabriz', service: 'wash', ratePerSqm: 200_000 },
  { rugType: 'kashan', service: 'wash', ratePerSqm: 190_000 },
  { rugType: 'ghashghaei', service: 'wash', ratePerSqm: 210_000 },
  { rugType: 'kilim', service: 'wash', ratePerSqm: 150_000 },
  { rugType: 'machine', service: 'wash', ratePerSqm: 80_000 },

  // شستشوی عمیق
  { rugType: 'persian_silk', service: 'deep_wash', ratePerSqm: 480_000 },
  { rugType: 'persian_wool', service: 'deep_wash', ratePerSqm: 290_000 },
  { rugType: 'tabriz', service: 'deep_wash', ratePerSqm: 320_000 },
  { rugType: 'kashan', service: 'deep_wash', ratePerSqm: 300_000 },
  { rugType: 'ghashghaei', service: 'deep_wash', ratePerSqm: 330_000 },
  { rugType: 'kilim', service: 'deep_wash', ratePerSqm: 240_000 },
  { rugType: 'machine', service: 'deep_wash', ratePerSqm: 130_000 },

  // پاکسازی لکه — نرخ ثابت per sqm
  { rugType: 'persian_silk', service: 'stain_removal', ratePerSqm: 150_000 },
  { rugType: 'persian_wool', service: 'stain_removal', ratePerSqm: 90_000 },
  { rugType: 'tabriz', service: 'stain_removal', ratePerSqm: 100_000 },
  { rugType: 'kashan', service: 'stain_removal', ratePerSqm: 95_000 },
  { rugType: 'ghashghaei', service: 'stain_removal', ratePerSqm: 110_000 },
  { rugType: 'kilim', service: 'stain_removal', ratePerSqm: 80_000 },
  { rugType: 'machine', service: 'stain_removal', ratePerSqm: 45_000 },

  // ترمیم
  { rugType: 'persian_silk', service: 'repair', ratePerSqm: 220_000 },
  { rugType: 'persian_wool', service: 'repair', ratePerSqm: 130_000 },
  { rugType: 'tabriz', service: 'repair', ratePerSqm: 150_000 },
  { rugType: 'kashan', service: 'repair', ratePerSqm: 140_000 },
  { rugType: 'ghashghaei', service: 'repair', ratePerSqm: 160_000 },
  { rugType: 'kilim', service: 'repair', ratePerSqm: 120_000 },
  { rugType: 'machine', service: 'repair', ratePerSqm: 60_000 },

  // حاشیه‌دوزی
  { rugType: 'persian_silk', service: 'edge_binding', ratePerSqm: 60_000 },
  { rugType: 'persian_wool', service: 'edge_binding', ratePerSqm: 40_000 },
  { rugType: 'tabriz', service: 'edge_binding', ratePerSqm: 45_000 },
  { rugType: 'kashan', service: 'edge_binding', ratePerSqm: 42_000 },
  { rugType: 'ghashghaei', service: 'edge_binding', ratePerSqm: 48_000 },
  { rugType: 'kilim', service: 'edge_binding', ratePerSqm: 36_000 },
  { rugType: 'machine', service: 'edge_binding', ratePerSqm: 25_000 },
];

/** جستجوی نرخ یک ترکیب نوع فرش + سرویس */
export function findRate(
  rules: PricingRule[],
  rugType: RugType,
  service: RugService,
): number {
  return rules.find((r) => r.rugType === rugType && r.service === service)
    ?.ratePerSqm ?? 0;
}

/**
 * محاسبه قیمت خودکار یک قلم — جمع نرخ سرویس‌ها ضربدر متراژ.
 *
 * نتیجه به ریال و گردشده به نزدیک‌ترین هزار ریال است. کارشناس می‌تواند
 * این مقدار را در فیلد قیمت ویرایش کند.
 */
export function calculateItemPrice(
  item: Pick<AssessmentItem, 'rugType' | 'areaSqm' | 'services' | 'damages' | 'stains'>,
  rules: PricingRule[] = DEFAULT_PRICING_RULES,
): number {
  const area = Number.isFinite(item.areaSqm) && item.areaSqm > 0 ? item.areaSqm : 0;
  if (area === 0 || item.services.length === 0) return 0;

  const base = item.services.reduce(
    (sum, service) => sum + findRate(rules, item.rugType, service) * area,
    0,
  );

  // اضافه‌دشت برای آسیب و لکه — هزینه ترمیم و پاکسازی سنگین‌تر
  const damageExtra = item.damages.length * 45_000 * area;
  const stainExtra = item.stains.reduce(
    (sum, s) => sum + s.severity * 30_000 * area,
    0,
  );

  return Math.round((base + damageExtra + stainExtra) / 1000) * 1000;
}

/** جمع کل اقلام (ریال) */
export function calculateSubtotal(items: AssessmentItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

/** مبلغ تخفیف از درصد (ریال) */
export function calculateDiscountAmount(
  subtotal: number,
  discountPercent: number,
): number {
  if (!Number.isFinite(discountPercent) || discountPercent <= 0) return 0;
  const capped = Math.min(discountPercent, 100);
  return Math.round((subtotal * capped) / 100 / 1000) * 1000;
}

/** مبلغ نهایی پس از تخفیف (ریال) */
export function calculateTotal(
  subtotal: number,
  discountAmount: number,
): number {
  return Math.max(0, subtotal - discountAmount);
}
