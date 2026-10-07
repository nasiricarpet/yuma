import { z } from 'zod';
import { toEnglishDigits } from '@yuma/persian';

/**
 * اعتبارسنجی کد ملی ایران: ۱۰ رقم + بیت کنترل (checksum)
 * الگوریتم رسمی: وزن‌های ۱۰ تا ۲ برای ۹ رقم اول، باقیمانده بر ۱۱
 */
export function isValidNationalCode(input: string): boolean {
  const code = toEnglishDigits(input.trim());
  if (!/^\d{10}$/.test(code)) return false;
  // کدهایی که همه ارقام یکسان‌اند نامعتبرند
  if (/^(\d)\1{9}$/.test(code)) return false;

  const digits = code.split('').map(Number);
  const check = digits[9]!;
  const sum = digits
    .slice(0, 9)
    .reduce((acc, d, i) => acc + d * (10 - i), 0);
  const remainder = sum % 11;

  return remainder < 2 ? check === remainder : check === 11 - remainder;
}

/** اسکیمای Zod کد ملی؛ خروجی نرمال‌شده با ارقام انگلیسی */
export const nationalCodeSchema = z
  .string({ error: 'کد ملی الزامی است' })
  .transform((v) => toEnglishDigits(v.trim()))
  .refine(isValidNationalCode, { message: 'کد ملی نامعتبر است' });

export type NationalCode = z.infer<typeof nationalCodeSchema>;
