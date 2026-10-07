import { formatCurrency, formatJalaliDate, toPersianDigits } from '@yuma/persian';
import { CURRENCY } from '@yuma/config';

/** تبدیل ریال به تومان برای نمایش */
export function rialToToman(rial: number): number {
  return Math.round(rial / CURRENCY.RIAL_PER_TOMAN);
}

/** قالب‌بندی مبلغ به تومان فارسی — ۱۲۰٬۰۰۰ تومان */
export function formatToman(rial: number): string {
  return formatCurrency(rialToToman(rial), 'toman');
}

/** قالب‌بندی مبلغ به ریال فارسی */
export function formatRial(rial: number): string {
  return formatCurrency(rial, 'rial');
}

/** تاریخ شمسی کامل — ۱۴۰۳/۰۷/۱۲ */
export function formatJalali(isoDate: string | Date): string {
  return formatJalaliDate(new Date(isoDate), 'YYYY/MM/DD');
}

/** تاریخ و ساعت شمسی — ۱۴۰۳/۰۷/۱۲ — ۱۴:۳۰ */
export function formatJalaliDateTime(isoDate: string | Date): string {
  return formatJalaliDate(new Date(isoDate), 'YYYY/MM/DD — HH:mm');
}

/** اعداد لاتین را به فارسی تبدیل می‌کند */
export function toFa(value: string | number): string {
  return toPersianDigits(value);
}

/** برش متن طولانی با علامت » … « */
export function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length)}…` : value;
}
