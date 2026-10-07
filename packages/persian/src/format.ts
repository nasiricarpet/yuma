/**
 * قالب‌بندی اعداد و پول به سبک فارسی
 * جداکننده هزارگان: ٬ (U+066C)
 * جداکننده اعشار: ٫ (U+066B)
 * واحد پول پیش‌فرض: تومان (IRT)
 */
import { toPersianDigits } from './digits';

export type CurrencyUnit = 'toman' | 'rial';

const GROUP_SEPARATOR = '\u066C'; // ٬
const DECIMAL_SEPARATOR = '\u066B'; // ٫

/** گروه‌بندی سه‌رقمی بخش صحیح یک رشته عددی بدون علامت */
function groupInteger(abs: string): string {
  let out = '';
  for (let i = 0; i < abs.length; i++) {
    const fromRight = abs.length - i;
    out += abs[i];
    if (fromRight > 1 && (fromRight - 1) % 3 === 0) out += ',';
  }
  return out;
}

function formatNumberParts(abs: string): string {
  return toPersianDigits(groupInteger(abs)).replace(/,/g, GROUP_SEPARATOR);
}

/**
 * قالب‌بندی مبلغ پول با واحد فارسی
 * @example formatCurrency(1250000)        // «۱٬۲۵۰٬۰۰۰ تومان»
 * @example formatCurrency(1000, 'rial')   // «۱٬۰۰۰ ریال»
 */
export function formatCurrency(amount: number, unit: CurrencyUnit = 'toman'): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new TypeError('formatCurrency: مقدار ورودی باید عددی متناهی باشد');
  }
  const value = Math.round(amount);
  const label = unit === 'toman' ? 'تومان' : 'ریال';
  const sign = value < 0 ? '-' : '';
  return `${sign}${formatNumberParts(String(Math.abs(value)))} ${label}`;
}

/**
 * قالب‌بندی عدد اعشاری با جداکننده‌های فارسی
 * @example formatDecimal(1234567.891) // «۱٬۲۳۴٬۵۶۷٫۸۹»
 */
export function formatDecimal(
  value: number,
  fractionDigits = 2,
  useGrouping = true,
): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError('formatDecimal: مقدار ورودی باید عددی متناهی باشد');
  }
  const sign = value < 0 ? '-' : '';
  const fixed = Math.abs(value).toFixed(fractionDigits);
  const [intPart, fracPart] = fixed.split('.');
  // جداکننده هزارگان باید فارسی (٬) باشد، نه کاما لاتین
  const grouped = useGrouping
    ? groupInteger(intPart ?? '0').replace(/,/g, GROUP_SEPARATOR)
    : (intPart ?? '0');
  const formatted = fracPart
    ? `${grouped}${DECIMAL_SEPARATOR}${fracPart}`
    : grouped;
  return sign + toPersianDigits(formatted);
}
