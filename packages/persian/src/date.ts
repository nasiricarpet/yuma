/**
 * قالب‌بندی تاریخ جلالی و روزهای کاری
 */
import { toPersianDigits } from './digits';
import { jalaliToJdn, jalaliWeekDayOf, jdnToJalali, type JalaliDate } from './jalali';
import { JALALI_WEEKDAY_NAMES, getJalaliMonthName } from './names';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * قالب‌بندی تاریخ جلالی با توکن‌ها:
 * YYYY = سال چهاررقمی، YY = دورقمی، MMMM = نام ماه، MM = ماه دو رقم، DD = روز دو رقم،
 * dddd = نام روز هفته، HH:mm = ساعت و دقیقه (فقط برای ورودی Date)
 *
 * @example formatJalaliDate(new Date('2026-09-30'))      // «۱۴۰۵/۰۷/۰۸»
 * @example formatJalaliDate(j, 'dddd MMMM YYYY')         // «سه‌شنبه مهر ۱۴۰۵»
 */
export function formatJalaliDate(
  date: Date | JalaliDate,
  format = 'YYYY/MM/DD',
  options: { persianDigits?: boolean } = {},
): string {
  const { persianDigits = true } = options;
  let jy: number, jm: number, jd: number;
  let hours = 0;
  let minutes = 0;

  if (date instanceof Date) {
    // مبتنی بر اجزای UTC تا نتیجه مستقل از timezone محلی باشد
    const jdn = Math.floor(date.getTime() / 86400000) + 2440588;
    const j = jdnToJalali(jdn);
    jy = j.jy;
    jm = j.jm;
    jd = j.jd;
    hours = date.getUTCHours();
    minutes = date.getUTCMinutes();
  } else {
    jy = date.jy;
    jm = date.jm;
    jd = date.jd;
  }

  // اگر قالب توکن ساعت داشته باشد، همان‌جا جای‌گذاری می‌شود؛
  // در غیر این صورت ساعت (در صورت غیرصفر بودن) به انتهای خروجی اضافه می‌شود.
  const hasTimeToken = /HH|mm/.test(format);
  let out = format
    .replace(/dddd/g, JALALI_WEEKDAY_NAMES[jalaliWeekDayOf(jy, jm, jd)]!)
    .replace(/MMMM/g, getJalaliMonthName(jm))
    .replace(/YYYY/g, String(jy).padStart(4, '0'))
    .replace(/YY/g, pad2(jy % 100))
    .replace(/MM(?!M)/g, pad2(jm))
    .replace(/DD/g, pad2(jd));

  if (date instanceof Date) {
    if (hasTimeToken) {
      out = out.replace(/HH/g, pad2(hours)).replace(/mm/g, pad2(minutes));
    } else if (hours !== 0 || minutes !== 0) {
      out += ` ${pad2(hours)}:${pad2(minutes)}`;
    }
  } else if (hasTimeToken) {
    // برای ورودی جلالی بدون ساعت، توکن‌ها صفر می‌شوند
    out = out.replace(/HH/g, pad2(0)).replace(/mm/g, pad2(0));
  }

  return persianDigits ? toPersianDigits(out) : out;
}

/** تبدیل رشته تاریخ جلالی «YYYY/MM/DD» به Date (نیمه‌شب UTC همان روز) */
export function parseJalaliDateString(value: string): Date {
  const m = /^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/.exec(value.trim());
  if (!m) throw new Error(`parseJalaliDateString: فرمت نامعتبر «${value}»`);
  const jy = Number(m[1]);
  const jm = Number(m[2]);
  const jd = Number(m[3]);
  if (jm < 1 || jm > 12 || jd < 1 || jd > 31) {
    throw new Error(`parseJalaliDateString: تاریخ نامعتبر «${value}»`);
  }
  return new Date((jalaliToJdn(jy, jm, jd) - 2440588) * 86400000);
}

/**
 * شمارش روزهای کاری بین دو تاریخ جلالی (شامل هر دو سر بازه)
 * پیش‌فرض: شنبه تا چهارشنبه کاری؛ پنجشنبه و جمعه تعطیل (پنجشنبه با گزینه قابل تغییر)
 * @param holidays تعطیلات رسمی به‌صورت تاریخ جلالی
 */
export function calculateBusinessDays(
  start: JalaliDate,
  end: JalaliDate,
  holidays: JalaliDate[] = [],
  options: { thursdayWorkday?: boolean } = {},
): number {
  const { thursdayWorkday = false } = options;
  const startJdn = jalaliToJdn(start.jy, start.jm, start.jd);
  const endJdn = jalaliToJdn(end.jy, end.jm, end.jd);
  if (endJdn < startJdn) return 0;

  const holidayJdns = new Set(holidays.map((h) => jalaliToJdn(h.jy, h.jm, h.jd)));
  let count = 0;
  for (let jdn = startJdn; jdn <= endJdn; jdn++) {
    const weekday = ((jdn + 2) % 7 + 7) % 7; // شنبه=۰ … جمعه=۶
    if (weekday === 6) continue; // جمعه تعطیل
    if (weekday === 5 && !thursdayWorkday) continue; // پنجشنبه پیش‌فرض تعطیل
    if (holidayJdns.has(jdn)) continue;
    count++;
  }
  return count;
}

export type { JalaliDate };
