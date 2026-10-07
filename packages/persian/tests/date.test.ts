import { describe, expect, it } from 'vitest';
import {
  calculateBusinessDays,
  formatJalaliDate,
  parseJalaliDateString,
} from '../src/date';
import { getJalaliDayName, getJalaliMonthName } from '../src/names';
import { toJalali } from '../src/jalali';

describe('getJalaliMonthName', () => {
  it('همه ماه‌ها', () => {
    expect(getJalaliMonthName(1)).toBe('فروردین');
    expect(getJalaliMonthName(7)).toBe('مهر');
    expect(getJalaliMonthName(12)).toBe('اسفند');
  });

  it('خطا برای ماه نامعتبر', () => {
    expect(() => getJalaliMonthName(0)).toThrow(RangeError);
    expect(() => getJalaliMonthName(13)).toThrow(RangeError);
  });
});

describe('getJalaliDayName', () => {
  it('روزهای هفته', () => {
    expect(getJalaliDayName(0)).toBe('شنبه');
    expect(getJalaliDayName(3)).toBe('سه‌شنبه');
    expect(getJalaliDayName(6)).toBe('جمعه');
  });

  it('خطا برای روز نامعتبر', () => {
    expect(() => getJalaliDayName(7)).toThrow(RangeError);
  });
});

describe('formatJalaliDate', () => {
  it('قالب پیش‌فرض YYYY/MM/DD با ارقام فارسی', () => {
    const j = toJalali({ gy: 2026, gm: 9, gd: 30 });
    expect(formatJalaliDate(j)).toBe('۱۴۰۵/۰۷/۰۸');
  });

  it('قالب با نام ماه و روز هفته', () => {
    const j = toJalali({ gy: 2026, gm: 9, gd: 30 });
    expect(formatJalaliDate(j, 'dddd MMMM YYYY')).toBe('چهارشنبه مهر ۱۴۰۵');
  });

  it('ارقام انگلیسی با گزینه persianDigits:false', () => {
    const j = toJalali({ gy: 2026, gm: 9, gd: 30 });
    expect(formatJalaliDate(j, 'YYYY/MM/DD', { persianDigits: false })).toBe('1405/07/08');
  });

  it('ساعت و دقیقه برای ورودی Date', () => {
    const d = new Date(Date.UTC(2026, 8, 30, 10, 5));
    expect(formatJalaliDate(d, 'YYYY/MM/DD HH:mm')).toBe('۱۴۰۵/۰۷/۰۸ ۱۰:۰۵');
  });
});

describe('parseJalaliDateString', () => {
  it('پارس تاریخ معتبر', () => {
    const d = parseJalaliDateString('1405/07/08');
    expect(d.toISOString()).toBe('2026-09-30T00:00:00.000Z');
  });

  it('خطا برای فرمت نامعتبر', () => {
    expect(() => parseJalaliDateString('not a date')).toThrow();
    expect(() => parseJalaliDateString('1405/13/01')).toThrow();
  });
});

describe('calculateBusinessDays', () => {
  const j = (jy: number, jm: number, jd: number) => ({ jy, jm, jd });

  it('یک هفته کامل کاری: شنبه تا پنجشنبه = ۵ روز', () => {
    // ۱۱ تا ۱۵ مهر ۱۴۰۵: شنبه تا چهارشنبه (پنجشنبه ۱۶ و جمعه ۱۷ تعطیل)
    expect(calculateBusinessDays(j(1405, 7, 11), j(1405, 7, 17))).toBe(5);
  });

  it('شمارش شامل دو سر بازه است', () => {
    expect(calculateBusinessDays(j(1405, 7, 11), j(1405, 7, 11))).toBe(1);
  });

  it('پنجشنبه کاری با گزینه thursdayWorkday', () => {
    expect(calculateBusinessDays(j(1405, 7, 16), j(1405, 7, 16), [], { thursdayWorkday: true })).toBe(1);
  });

  it('تعطیلات رسمی از شمارش حذف می‌شوند', () => {
    // ۱۴۰۵/۰۷/۱۲ (دوشنبه) را تعطیل فرض می‌کنیم
    expect(calculateBusinessDays(j(1405, 7, 11), j(1405, 7, 14), [j(1405, 7, 12)])).toBe(3);
  });

  it('بازه معکوس صفر برمی‌گرداند', () => {
    expect(calculateBusinessDays(j(1405, 7, 20), j(1405, 7, 10))).toBe(0);
  });
});
