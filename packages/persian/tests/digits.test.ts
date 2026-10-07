import { describe, expect, it } from 'vitest';
import { toEnglishDigits, toPersianDigits } from '../src/digits';

describe('toPersianDigits', () => {
  it('تبدیل رشته با ارقام انگلیسی به فارسی', () => {
    expect(toPersianDigits('1234567890')).toBe('۱۲۳۴۵۶۷۸۹۰');
  });

  it('تبدیل عدد به رشته فارسی', () => {
    expect(toPersianDigits(1403)).toBe('۱۴۰۳');
  });

  it('حفظ حروف غیرعددی در متن', () => {
    expect(toPersianDigits('سفارش 12 در تاریخ 2026/09/30')).toBe(
      'سفارش ۱۲ در تاریخ ۲۰۲۶/۰۹/۳۰',
    );
  });

  it('رشته خالی بدون تغییر', () => {
    expect(toPersianDigits('')).toBe('');
  });
});

describe('toEnglishDigits', () => {
  it('تبدیل ارقام فارسی به انگلیسی', () => {
    expect(toEnglishDigits('۱۲۳۴۵۶۷۸۹۰')).toBe('1234567890');
  });

  it('تبدیل ارقام عربی به انگلیسی', () => {
    expect(toEnglishDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('ترکیب فارسی و عربی در یک متن', () => {
    expect(toEnglishDigits('کد ۱۲ و ٣٤')).toBe('کد 12 و 34');
  });

  it('رفت و برگشت ارقام ID را حفظ می‌کند', () => {
    const s = '09121234567';
    expect(toEnglishDigits(toPersianDigits(s))).toBe(s);
  });
});
