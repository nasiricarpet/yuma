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

/**
 * مدت زمان گذشته‌شده از یک تاریخ به فارسی — «۳ ساعت»، «۲ روز»
 *
 * روی شماره‌گذاری فارسی و واحد صحیح (ساعت/روز) تأکید می‌کند.
 */
export function formatElapsed(isoDate: string | Date): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(0, Math.round(ms / 60_000));

  if (minutes < 60) return `${toPersianDigits(Math.max(1, minutes))} دقیقه`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    const unit = hours === 1 ? 'ساعت' : 'ساعت';
    return `${toPersianDigits(hours)} ${unit}`;
  }

  const days = Math.round(hours / 24);
  const unit = days === 1 ? 'روز' : 'روز';
  return `${toPersianDigits(days)} ${unit}`;
}

/**
 * آیا این تاریخ بیشتر از آستانه مشخص شده گذشته است؟
 *
 * برای فیلتر «زمان انتظار» در لیست ارزیابی استفاده می‌شود.
 */
export function isOlderThan(isoDate: string | Date, hours: number): boolean {
  return Date.now() - new Date(isoDate).getTime() > hours * 3_600_000;
}
