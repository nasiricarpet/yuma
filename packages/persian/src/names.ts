/** نام ماه‌های هجری شمسی (اندیس ۰ = فروردین) */
export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

/** نام روزهای هفته از شنبه (اندیس ۰) تا جمعه */
export const JALALI_WEEKDAY_NAMES = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
] as const;

/** نام کوتاه روزهای هفته (برای هدر تقویم) */
export const JALALI_WEEKDAY_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;

/** نام ماه جلالی (۱ تا ۱۲) */
export function getJalaliMonthName(month: number): string {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError('getJalaliMonthName: ماه باید عددی بین ۱ تا ۱۲ باشد');
  }
  return JALALI_MONTH_NAMES[month - 1]!;
}

/** نام روز هفته (شنبه = ۰ … جمعه = ۶) */
export function getJalaliDayName(day: number): string {
  if (!Number.isInteger(day) || day < 0 || day > 6) {
    throw new RangeError('getJalaliDayName: روز باید عددی بین ۰ (شنبه) تا ۶ (جمعه) باشد');
  }
  return JALALI_WEEKDAY_NAMES[day]!;
}
