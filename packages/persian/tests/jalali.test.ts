import { describe, expect, it } from 'vitest';
import {
  gregorianToJdn,
  isJalaliLeap,
  jalaliMonthLength,
  jalaliToJdn,
  jalaliWeekDayOf,
  jdnToGregorian,
  jdnToJalali,
  toGregorian,
  toJalali,
} from '../src/jalali';

describe('isJalaliLeap', () => {
  it('سال‌های کبیسه شناخته‌شده', () => {
    // ۱۳۷۰، ۱۳۷۵، ۱۳۷۹، ۱۳۸۳، ۱۳۸۷، ۱۳۹۱، ۱۳۹۵، ۱۳۹۹، ۱۴۰۳ کبیسه‌اند
    for (const y of [1370, 1375, 1379, 1383, 1387, 1391, 1395, 1399, 1403]) {
      expect(isJalaliLeap(y)).toBe(true);
    }
  });

  it('سال‌های غیرکبیسه شناخته‌شده', () => {
    for (const y of [1371, 1374, 1381, 1390, 1400, 1402, 1404]) {
      expect(isJalaliLeap(y)).toBe(false);
    }
  });
});

describe('jalaliMonthLength', () => {
  it('شش ماه اول ۳۱ روزه', () => {
    for (const m of [1, 2, 3, 4, 5, 6]) {
      expect(jalaliMonthLength(1404, m)).toBe(31);
    }
  });

  it('ماه‌های ۷ تا ۱۱ سی روزه', () => {
    for (const m of [7, 8, 9, 10, 11]) {
      expect(jalaliMonthLength(1404, m)).toBe(30);
    }
  });

  it('اسفند سال عادی ۲۹ و کبیسه ۳۰ روز', () => {
    expect(jalaliMonthLength(1404, 12)).toBe(29); // ۱۴۰۴ عادی
    expect(jalaliMonthLength(1403, 12)).toBe(30); // ۱۴۰۳ کبیسه
  });
});

describe('toJalali', () => {
  it('تاریخ‌های مرجع معروف', () => {
    // ۱ فروردین ۱۴۰۳ = ۲۰ مارس ۲۰۲۴
    expect(toJalali({ gy: 2024, gm: 3, gd: 20 })).toEqual({ jy: 1403, jm: 1, jd: 1 });
    // ۱ فروردین ۱۴۰۰ = ۲۱ مارس ۲۰۲۱
    expect(toJalali({ gy: 2021, gm: 3, gd: 21 })).toEqual({ jy: 1400, jm: 1, jd: 1 });
    // ۳۰ سپتامبر ۲۰۲۶ = ۸ مهر ۱۴۰۵
    expect(toJalali({ gy: 2026, gm: 9, gd: 30 })).toEqual({ jy: 1405, jm: 7, jd: 8 });
    // آخر اسفند ۱۳۹۹ (کبیسه) = ۲۰ مارس ۲۰۲۱
    expect(toJalali({ gy: 2021, gm: 3, gd: 20 })).toEqual({ jy: 1399, jm: 12, jd: 30 });
  });

  it('کار با شیء Date (مبنای UTC)', () => {
    expect(toJalali(new Date(Date.UTC(2026, 8, 30)))).toEqual({ jy: 1405, jm: 7, jd: 8 });
  });

  it('رفت‌وبرگشت کامل در بازه وسیع', () => {
    // برای هر روز در بازه ۲۰۲۰ تا ۲۰۳۰ باید تبدیل جلالی→میلادی→جلالی پایدار باشد
    for (let jdn = gregorianToJdn(2020, 1, 1); jdn <= gregorianToJdn(2030, 12, 31); jdn++) {
      const j = jdnToJalali(jdn);
      const g = jdnToGregorian(jalaliToJdn(j.jy, j.jm, j.jd));
      expect(gregorianToJdn(g.getUTCFullYear(), g.getUTCMonth() + 1, g.getUTCDate())).toBe(jdn);
    }
  });
});

describe('toGregorian', () => {
  it('۱ فروردین ۱۴۰۳ = ۲۰ مارس ۲۰۲۴', () => {
    const g = toGregorian(1403, 1, 1);
    expect(g.getUTCFullYear()).toBe(2024);
    expect(g.getUTCMonth()).toBe(2); // مارس = اندیس ۲
    expect(g.getUTCDate()).toBe(20);
  });

  it('۵ مهر ۱۴۰۵ = ۲۷ سپتامبر ۲۰۲۶', () => {
    const g = toGregorian(1405, 7, 5);
    expect(g.getUTCFullYear()).toBe(2026);
    expect(g.getUTCMonth()).toBe(8); // سپتامبر = اندیس ۸
    expect(g.getUTCDate()).toBe(27);
  });
});

describe('jalaliWeekDayOf', () => {
  it('۱ فروردین ۱۴۰۳ چهارشنبه است (اندیس ۴)', () => {
    expect(jalaliWeekDayOf(1403, 1, 1)).toBe(4);
  });

  it('۸ مهر ۱۴۰۵ چهارشنبه است (اندیس ۴)', () => {
    expect(jalaliWeekDayOf(1405, 7, 8)).toBe(4);
  });
});
