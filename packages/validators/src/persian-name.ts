import { z } from 'zod';

/**
 * نام فارسی: حروف فارسی + نیم‌فاصله (ZWNJ) + فاصله
 * حداقل ۲ و حداکثر ۶۰ کاراکتر
 */
const PERSIAN_NAME_REGEX =
  /^[\u0621-\u064A\u0670\u067E\u0686\u0698\u06A9\u06AF\u06CC\u200C\s]{2,60}$/;

export const persianNameSchema = z
  .string({ error: 'نام الزامی است' })
  .transform((v) => v.trim().replace(/\s+/g, ' '))
  .refine((v) => PERSIAN_NAME_REGEX.test(v), {
    message: 'نام باید فقط شامل حروف فارسی باشد (۲ تا ۶۰ کاراکتر)',
  });

export type PersianName = z.infer<typeof persianNameSchema>;

/** بررسی سریع نام فارسی */
export function isValidPersianName(value: string): boolean {
  return persianNameSchema.safeParse(value).success;
}
