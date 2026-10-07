/**
 * تبدیل تاریخ میلادی ↔ جلالی
 * الگوریتم دوره ۳۳-ساله — دقیق برای بازه سال‌های ۱۱۷۸ تا ۱۶۳۳ جلالی
 * همه محاسبات روی شماره روز جولیَن (JDN) انجام می‌شود و مستقل از timezone است.
 *
 * مرجع: https://en.wikipedia.org/wiki/Solar_Hijri_calendar
 */

export interface JalaliDate {
  jy: number; // سال جلالی
  jm: number; // ماه ۱..۱۲
  jd: number; // روز ۱..۳۱
}

/** آغاز سال ۱۴۰۳ جلالی = ۲۰۲۴-۰۳-۲۰ میلادی = JDN 2460390 (مبنای تثبیت‌شده) */
const ANCHOR_JY = 1403;
const ANCHOR_JDN = 2460390;

/** باقیمانده‌های سال کبیسه در دوره ۳۳-ساله */
const LEAP_REMAINDERS = [1, 5, 9, 13, 17, 22, 26, 30];

/** آیا سال جلالی کبیسه است؟ */
export function isJalaliLeap(jy: number): boolean {
  return LEAP_REMAINDERS.includes(((jy % 33) + 33) % 33);
}

/** تعداد روزهای یک ماه جلالی */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeap(jy) ? 30 : 29;
}

/** روز سال (۱..۳۶۶) از ماه و روز جلالی */
function jalaliDayOfYear(jm: number, jd: number): number {
  return jm <= 6 ? (jm - 1) * 31 + jd : 186 + (jm - 7) * 30 + jd;
}

/** JDN ابتدای سال جلالی (۱ فروردین) */
export function jalaliYearStartJdn(jy: number): number {
  let days = 0;
  if (jy >= ANCHOR_JY) {
    for (let y = ANCHOR_JY; y < jy; y++) days += isJalaliLeap(y) ? 366 : 365;
  } else {
    for (let y = ANCHOR_JY - 1; y >= jy; y--) days -= isJalaliLeap(y) ? 366 : 365;
  }
  return ANCHOR_JDN + days;
}

/** تبدیل سال/ماه/روز جلالی به شماره روز جولیَن (JDN) */
export function jalaliToJdn(jy: number, jm: number, jd: number): number {
  return jalaliYearStartJdn(jy) + jalaliDayOfYear(jm, jd) - 1;
}

/** تبدیل شماره روز جولیَن به تاریخ جلالی */
export function jdnToJalali(jdn: number): JalaliDate {
  const approx = Math.floor((jdn - ANCHOR_JDN) / 365) + ANCHOR_JY;
  let jy = approx;
  while (jalaliYearStartJdn(jy + 1) <= jdn) jy++;
  while (jalaliYearStartJdn(jy) > jdn) jy--;
  const dayOfYear = jdn - jalaliYearStartJdn(jy) + 1;
  const jm = dayOfYear <= 186 ? Math.ceil(dayOfYear / 31) : Math.ceil((dayOfYear - 186) / 30) + 6;
  const jd = dayOfYear <= 186 ? dayOfYear - (jm - 1) * 31 : dayOfYear - 186 - (jm - 7) * 30;
  return { jy, jm, jd };
}

/** تبدیل تاریخ میلادی (Date با اجزای UTC یا اجزای عددی) به جلالی */
export function toJalali(gregorian: Date | { gy: number; gm: number; gd: number }): JalaliDate {
  let gy: number, gm: number, gd: number;
  if (gregorian instanceof Date) {
    // از اجزای UTC استفاده می‌کنیم تا نتیجه مستقل از timezone محلی باشد
    gy = gregorian.getUTCFullYear();
    gm = gregorian.getUTCMonth() + 1;
    gd = gregorian.getUTCDate();
  } else {
    ({ gy, gm, gd } = gregorian);
  }
  return jdnToJalali(gregorianToJdn(gy, gm, gd));
}

/** تبدیل تاریخ جلالی به Date میلادی (نیمه‌شب UTC همان روز) */
export function toGregorian(jy: number, jm: number, jd: number): Date {
  return jdnToGregorian(jalaliToJdn(jy, jm, jd));
}

/** سال/ماه/روز میلادی → شماره روز جولیَن (فرمول استاندارد گریگوری) */
export function gregorianToJdn(gy: number, gm: number, gd: number): number {
  const a = Math.floor((14 - gm) / 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  return (
    gd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/** شماره روز جولیَن → Date میلادی (نیمه‌شب UTC) */
export function jdnToGregorian(jdn: number): Date {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const gd = e - Math.floor((153 * m + 2) / 5) + 1;
  const gm = m + 3 - 12 * Math.floor(m / 10);
  const gy = 100 * b + d - 4800 + Math.floor(m / 10);
  return new Date(Date.UTC(gy, gm - 1, gd));
}

/**
 * شماره روز هفته از JDN: شنبه=۰، یکشنبه=۱، ... جمعه=۶
 * (JDN های ≡ 5 (mod 7) شنبه هستند — مثلاً 2000-01-01 که شنبه بود)
 */
export function jalaliWeekDay(jdn: number): number {
  return (((jdn + 2) % 7) + 7) % 7;
}

/** شماره روز هفته برای تاریخ جلالی */
export function jalaliWeekDayOf(jy: number, jm: number, jd: number): number {
  return jalaliWeekDay(jalaliToJdn(jy, jm, jd));
}
