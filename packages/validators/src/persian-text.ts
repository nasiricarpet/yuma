import { z } from 'zod';

/**
 * متن فارسی: حروف فارسی، ارقام، علائم نگارشی فارسی، نیم‌فاصله، فاصله و خط جدید
 * قابل تنظیم با حداقل/حداکثر طول
 */
const PERSIAN_TEXT_REGEX =
  /^[\u0621-\u064A\u0670\u067E\u0686\u0698\u06A9\u06AF\u06CC\u06F0-\u06F9\u200C\s،؛:.!؟«»()\-+٪/\\]*$/;

export interface PersianTextOptions {
  min?: number;
  max?: number;
}

export function createPersianTextSchema(options: PersianTextOptions = {}) {
  const { min = 1, max = 1000 } = options;
  return z
    .string({ error: 'متن الزامی است' })
    .transform((v) => v.trim())
    .refine((v) => v.length >= min && v.length <= max, {
      message: `متن باید بین ${min} تا ${max} کاراکتر باشد`,
    })
    .refine((v) => PERSIAN_TEXT_REGEX.test(v), {
      message: 'متن باید فقط شامل حروف و علائم فارسی باشد',
    });
}

/** اسکیمای پیش‌فرض متن فارسی (۱ تا ۱۰۰۰ کاراکتر) */
export const persianTextSchema = createPersianTextSchema();

export type PersianText = z.infer<typeof persianTextSchema>;
