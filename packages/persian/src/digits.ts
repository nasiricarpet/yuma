/**
 * تبدیل ارقام انگلیسی/عربی به فارسی و برعکس
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

/** تبدیل ارقام لاتین (0-9) داخل هر متن به ارقام فارسی (۰-۹) */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]!);
}

/** تبدیل ارقام فارسی (۰-۹) و عربی (٠-٩) به ارقام لاتین (0-9) */
export function toEnglishDigits(input: string): string {
  return String(input)
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}
