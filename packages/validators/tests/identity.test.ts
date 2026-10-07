import { describe, expect, it } from 'vitest';
import {
  isValidMobile,
  isValidNationalCode,
  isValidPostalCode,
  mobileSchema,
  nationalCodeSchema,
  normalizeMobile,
  normalizePostalCode,
  postalCodeSchema,
} from '../src';

describe('mobileSchema', () => {
  it('شماره معتبر', () => {
    expect(mobileSchema.parse('09121234567')).toBe('09121234567');
  });

  it('نرمال‌سازی +98', () => {
    expect(mobileSchema.parse('+989121234567')).toBe('09121234567');
  });

  it('نرمال‌سازی ارقام فارسی', () => {
    expect(mobileSchema.parse('۰۹۱۲۱۲۳۴۵۶۷')).toBe('09121234567');
  });

  it('نرمال‌سازی پیش‌شماره بین‌المللی ۰۰۹۸', () => {
    expect(mobileSchema.parse('00989121234567')).toBe('09121234567');
  });

  it('نرمال‌سازی پیش‌شماره بین‌المللی ۹۸', () => {
    expect(mobileSchema.parse('989121234567')).toBe('09121234567');
  });

  it('حذف خط تیره و فاصله', () => {
    expect(mobileSchema.parse('0912-123 4567')).toBe('09121234567');
  });

  it('normalizeMobile همه شکل‌ها را یکسان می‌کند', () => {
    const expected = '09121234567';
    for (const input of ['09121234567', '+989121234567', '00989121234567', '989121234567']) {
      expect(normalizeMobile(input)).toBe(expected);
    }
  });

  it('رد شماره‌های نامعتبر', () => {
    expect(() => mobileSchema.parse('08121234567')).toThrow();
    expect(() => mobileSchema.parse('0912123456')).toThrow();
    expect(() => mobileSchema.parse('abc')).toThrow();
  });

  it('isValidMobile', () => {
    expect(isValidMobile('09351112233')).toBe(true);
    expect(isValidMobile('12345')).toBe(false);
  });
});

describe('nationalCodeSchema', () => {
  it('کد ملی معتبر (باقیمانده ۲ → رقم کنترل ۹)', () => {
    // ارقام 012345678 با وزن‌های 10..2 → جمع ۱۵۶ → باقیمانده ۲ → کنترل = ۹
    expect(nationalCodeSchema.parse('0123456789')).toBe('0123456789');
  });

  it('کد ملی معتبر دوم (باقیمانده ۱ → کنترل ۱)', () => {
    expect(isValidNationalCode('1234567891')).toBe(true);
  });

  it('پذیرش ارقام فارسی', () => {
    expect(isValidNationalCode('۰۱۲۳۴۵۶۷۸۹')).toBe(true);
  });

  it('رد ارقام تکراری', () => {
    expect(isValidNationalCode('0000000000')).toBe(false);
    expect(isValidNationalCode('1111111111')).toBe(false);
  });

  it('رد رقم کنترل غلط', () => {
    expect(isValidNationalCode('0123456780')).toBe(false);
  });

  it('رد طول نامعتبر', () => {
    expect(isValidNationalCode('12345')).toBe(false);
    expect(isValidNationalCode('01234567890')).toBe(false);
  });
});

describe('postalCodeSchema', () => {
  it('کد پستی معتبر', () => {
    expect(postalCodeSchema.parse('1234567890')).toBe('1234567890');
  });

  it('نرمال‌سازی ارقام فارسی', () => {
    expect(postalCodeSchema.parse('۱۲۳۴۵۶۷۸۹۰')).toBe('1234567890');
  });

  it('حذف خط تیره و فاصله', () => {
    expect(postalCodeSchema.parse('12345-67890')).toBe('1234567890');
    expect(postalCodeSchema.parse('۱۲۳۴۵-۶۷۸۹۰')).toBe('1234567890');
    expect(normalizePostalCode('12345 67890')).toBe('1234567890');
  });

  it('رد کد نامعتبر', () => {
    expect(() => postalCodeSchema.parse('12345')).toThrow();
    expect(() => postalCodeSchema.parse('12345678901')).toThrow();
  });

  it('isValidPostalCode', () => {
    expect(isValidPostalCode('5151911111')).toBe(true);
    expect(isValidPostalCode('51-519')).toBe(false);
  });
});
