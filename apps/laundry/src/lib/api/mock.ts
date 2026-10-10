import { calculateItemPrice } from '../pricing';
import type {
  Assessment,
  AssessmentItem,
  AssessmentListRow,
  RugType,
} from '../types';

/**
 * داده‌های نمونه برای توسعه رابط کاربری —
 *
 * API هنوز endpoints ارزیابی را ندارد؛ این داده‌ها فقط زمانی استفاده می‌شوند
 * که سرور در دسترس نباشد، تا بتوان صفحات را به‌صورت بصری بررسی کرد.
 * با راه‌اندازی کامل backend، این ماژول دیگر فراخوانی نمی‌شود.
 */

const HOURS_AGO = (hours: number): string =>
  new Date(Date.now() - hours * 3_600_000).toISOString();

export const MOCK_ASSESSMENT_ROWS: AssessmentListRow[] = [
  {
    orderId: 'ord-1001',
    trackingCode: 'YUMA-1042',
    customerName: 'زهرا محمدی',
    itemCount: 3,
    arrivedAt: HOURS_AGO(5),
    customerMobile: '09121111111',
  },
  {
    orderId: 'ord-1002',
    trackingCode: 'YUMA-1041',
    customerName: 'علی رضایی',
    itemCount: 2,
    arrivedAt: HOURS_AGO(26),
    customerMobile: '09122222222',
  },
  {
    orderId: 'ord-1003',
    trackingCode: 'YUMA-1038',
    customerName: 'مریم کریمی',
    itemCount: 5,
    arrivedAt: HOURS_AGO(50),
    customerMobile: '09123333333',
  },
  {
    orderId: 'ord-1004',
    trackingCode: 'YUMA-1035',
    customerName: 'حسین نوری',
    itemCount: 1,
    arrivedAt: HOURS_AGO(96),
    customerMobile: '09124444444',
  },
  {
    orderId: 'ord-1005',
    trackingCode: 'YUMA-1030',
    customerName: 'فاطمه احمدی',
    itemCount: 4,
    arrivedAt: HOURS_AGO(11),
    customerMobile: '09125555555',
  },
];

const DEFAULT_RUG_TYPE: RugType = 'persian_wool';

/**
 * ساخت اقلام نمونه — قیمت هر قلم از همان قواعد قیمت‌گذاری محاسبه می‌شود
 * تا پیش‌نمایش با رفتار واقعی فرم منطبق باشد.
 */
function buildMockItems(count: number): AssessmentItem[] {
  return Array.from({ length: count }, (_, index) => {
    const item: AssessmentItem = {
      id: `item-${index + 1}`,
      rugType: DEFAULT_RUG_TYPE,
      areaSqm: index === 0 ? 6 : 4,
      services: ['wash'],
      damages: [],
      stains: [],
      price: 0,
      note: undefined,
    };
    return { ...item, price: calculateItemPrice(item) };
  });
}

export function buildMockAssessment(orderId: string): Assessment {
  const row = MOCK_ASSESSMENT_ROWS.find((r) => r.orderId === orderId);

  return {
    orderId,
    trackingCode: row?.trackingCode ?? 'YUMA-????',
    customerName: row?.customerName ?? 'مشتری نمونه',
    status: 'draft',
    items: buildMockItems(row?.itemCount ?? 0),
    discountPercent: 0,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
    updatedAt: HOURS_AGO(1),
  };
}
