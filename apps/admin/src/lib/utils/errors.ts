/**
 * استخراج پیام فارسی خطای API.
 *
 * بک‌اند خطاها را در بدنهٔ پاسخ با فیلد `message` (نست‌کنترلر) یا
 * آرایهٔ `message` در `AllExceptionsFilter` برمی‌گرداند. این تابع
 * پیام خوانا را برمی‌گرداند و در غیر این صورت یک پیام عمومی فارسی.
 */
export function getApiErrorMessage(error: unknown): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;

  if (data !== null && typeof data === 'object') {
    const message = (data as { message?: unknown }).message;

    // ValidationPipe پیام هر فیلد را به‌صورت آرایه می‌فرستد
    if (Array.isArray(message)) return String(message[0]);
    if (typeof message === 'string' && message) return message;
  }

  return 'عملیات ناموفق بود. دوباره تلاش کنید.';
}
