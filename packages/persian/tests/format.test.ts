import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDecimal } from '../src/format';
import { toEnglishDigits } from '../src/digits';

describe('formatCurrency', () => {
  it('قالب‌بندی ساده تومانی', () => {
    expect(formatCurrency(0)).toBe('۰ تومان');
    expect(formatCurrency(1000)).toBe('۱٬۰۰۰ تومان');
  });

  it('جداکننده هزارگان سه‌رقمی', () => {
    expect(formatCurrency(1250000)).toBe('۱٬۲۵۰٬۰۰۰ تومان');
  });

  it('واحد ریال', () => {
    expect(formatCurrency(50000, 'rial')).toBe('۵۰٬۰۰۰ ریال');
  });

  it('گرد کردن اعشار', () => {
    expect(formatCurrency(1000.6)).toBe('۱٬۰۰۱ تومان');
  });

  it('عدد منفی', () => {
    expect(formatCurrency(-25000)).toBe('-۲۵٬۰۰۰ تومان');
  });

  it('خروجی فقط با ارقام فارسی است', () => {
    expect(formatCurrency(999999)).not.toMatch(/[0-9]/);
  });

  it('خطا برای ورودی غیرعددی', () => {
    expect(() => formatCurrency(NaN as unknown as number)).toThrow(TypeError);
    expect(() => formatCurrency(Infinity as unknown as number)).toThrow(TypeError);
  });
});

describe('formatDecimal', () => {
  it('جداکننده اعشار فارسی ٫', () => {
    const out = formatDecimal(3.5);
    expect(out).toContain('٫');
    expect(toEnglishDigits(out.replace('٫', '.'))).toBe('3.50');
  });

  it('گروه‌بندی و اعشار با هم', () => {
    expect(toEnglishDigits(formatDecimal(1234567.891).replace(/٫|٬/g, (c) => (c === '٫' ? '.' : ',')))).toBe(
      '1,234,567.89',
    );
  });

  it('جداکننده هزارگان فارسی ٬ (نه کاما لاتین)', () => {
    const out = formatDecimal(1234567.891);
    expect(out).toContain('٬');
    expect(out).not.toContain(',');
  });

  it('بدون گروه‌بندی', () => {
    expect(toEnglishDigits(formatDecimal(1234.5, 1, false).replace('٫', '.'))).toBe('1234.5');
  });

  it('کنترل تعداد ارقام اعشار', () => {
    expect(toEnglishDigits(formatDecimal(1, 3).replace('٫', '.'))).toBe('1.000');
  });
});
