import { z } from 'zod';
import { toEnglishDigits } from '@yuma/persian';

/**
 * اعتبارسنجی شبا (IBAN ایران): IR + ۲ رقم کنترل + ۲۴ رقم حساب = ۲۶ کاراکتر
 * الگوریتم MOD-97 (استاندارد ISO 7064)
 */
export function isValidIban(input: string): boolean {
  const raw = toEnglishDigits(input.trim().toUpperCase().replace(/[\s-]/g, ''));
  if (!/^IR\d{24}$/.test(raw)) return false;

  // چهار کاراکتر اول به انتها منتقل و حروف به عدد تبدیل می‌شوند (I=18, R=27)
  const rearranged = raw.slice(4) + raw.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));

  // محاسبه mod 97 بدون BigInt (پردازش تکه‌تکه)
  let remainder = 0;
  for (const digit of numeric) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

/** اسکیمای Zod شبا؛ خروجی نرمال‌شده بدون فاصله و با حروف بزرگ */
export const ibanSchema = z
  .string({ error: 'شماره شبا الزامی است' })
  .transform((v) => toEnglishDigits(v.trim().toUpperCase().replace(/[\s-]/g, '')))
  .refine(isValidIban, { message: 'شماره شبا نامعتبر است' });

export type Iban = z.infer<typeof ibanSchema>;
