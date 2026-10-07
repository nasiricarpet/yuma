import { z } from 'zod';
import { toEnglishDigits } from '@yuma/persian';

/**
 * کد پستی ایران: ۱۰ رقم
 *
 * ارقام فارسی/عربی پذیرفته می‌شوند و جداکننده‌های رایج (خط تیره و فاصله)
 * حذف می‌گردند: «۵۱۳۶۸-۵۳۹۵۱» → «5136853951»
 */
export function normalizePostalCode(input: string): string {
  return toEnglishDigits(input.trim()).replace(/[\s-]/g, '');
}

export const postalCodeSchema = z
  .string({ error: 'کد پستی الزامی است' })
  .transform(normalizePostalCode)
  .refine((v) => /^\d{10}$/.test(v), {
    message: 'کد پستی باید ۱۰ رقم باشد',
  });

export type PostalCode = z.infer<typeof postalCodeSchema>;

export function isValidPostalCode(value: string): boolean {
  return postalCodeSchema.safeParse(value).success;
}
