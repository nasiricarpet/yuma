import { z } from 'zod';
import { toEnglishDigits } from '@yuma/persian';

/**
 * شماره موبایل ایران: 09xxxxxxxxx
 *
 * ارقام فارسی/عربی پذیرفته و به انگلیسی نرمال می‌شوند. همه شکل‌های رایج نوشتار
 * ایران به یک شکل یکسان تبدیل می‌شوند:
 *   +989123456789  → 09123456789
 *   00989123456789 → 09123456789
 *   989123456789   → 09123456789
 *   0912-345 6789  → 09123456789
 */
export function normalizeMobile(input: string): string {
  const digits = toEnglishDigits(input.trim()).replace(/\D/g, '');

  // پیش‌شماره بین‌المللی ایران (0098 / 98)
  if (digits.startsWith('0098')) return '0' + digits.slice(4);
  if (digits.startsWith('98') && digits.length === 12) return '0' + digits.slice(2);

  return digits;
}

export const mobileSchema = z
  .string({ error: 'شماره موبایل الزامی است' })
  .transform(normalizeMobile)
  .refine((v) => /^09\d{9}$/.test(v), {
    message: 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود',
  });

export type Mobile = z.infer<typeof mobileSchema>;

/** اعتبارسنجی سریع بدون ساخت اسکیما */
export function isValidMobile(value: string): boolean {
  return mobileSchema.safeParse(value).success;
}
