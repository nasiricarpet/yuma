/**
 * ابزارهای مشترک ماژول کاربران — ماسک‌سازی موبایل و ساختار صفحه‌بندی
 */

/**
 * ماسک موبایل برای نمایش در پنل ادمین — ۴ رقم اول و ۴ رقم آخر نگه داشته می‌شوند
 *
 * @example
 * maskMobile('09123456789') // '0912***6789'
 */
export function maskMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');

  if (digits.length !== 11) return mobile;

  return `${digits.slice(0, 4)}***${digits.slice(7)}`;
}

/**
 * ساختار یکسان همه پاسخ‌های صفحه‌بندی‌شده‌ی API
 */
export interface Paginated<T> {
  /** آیتم‌های صفحه جاری */
  items: T[];
  /** تعداد کل رکوردهای منطبق */
  total: number;
  /** شماره صفحه جاری — از ۱ شروع می‌شود */
  page: number;
  /** تعداد آیتم در هر صفحه */
  limit: number;
  /** تعداد کل صفحات */
  totalPages: number;
}
