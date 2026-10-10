/**
 * ثابت‌های ماژول پشتیبانی — نام صف و jobهای SLA
 *
 * این فایل وابستگی‌ای به سایر بخش‌های ماژول ندارد تا چرخه‌ی
 * import بین `support.service.ts` و `jobs/sla.processor.ts` بشکند:
 * هر دو از اینجا ثابت‌ها را می‌گیرند و هیچ‌کدام دیگری را برای
 * ثابت‌ها import نمی‌کند.
 */

/** نام صف پشتیبانی — هم برای jobهای SLA و هم پاسخ‌های ناهمگام */
export const SUPPORT_QUEUE = 'support';

/** job بررسی نقض SLA برای یک تیکت — payload: { ticketId } */
export const SUPPORT_SLA_JOB = 'support:check-sla';

/** job اسکن دوره‌ای همه‌ی تیکت‌های سررسید‌شده — بدون payload */
export const SUPPORT_SLA_SCAN_JOB = 'support:scan-sla';

/**
 * payload job بررسی SLA یک تیکت
 */
export interface SlaCheckJobData {
  ticketId: string;
}
