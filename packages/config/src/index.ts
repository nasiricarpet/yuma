/**
 * ثابت‌های بومی‌سازی ایرانی — منبع واحد حقیقت برای کل Monorepo
 */

/** لوکال اصلی پروژه */
export const APP_LOCALE = 'fa-IR';

/** جهت متن: راست‌به‌چپ از روز اول */
export const APP_DIR = 'rtl' as const;

/** منطقه زمانی رسمی سیستم */
export const APP_TIMEZONE = 'Asia/Tehran';

/** واحد پول داخلی: تومان (IRT)؛ ذخیره‌سازی دقیق مالی: ریال (IRR) */
export const CURRENCY = {
  /** واحد نمایش به کاربر */
  display: 'IRT',
  /** واحد ذخیره‌سازی در دیتابیس */
  storage: 'IRR',
  /** ۱ تومان = ۱۰ ریال */
  RIAL_PER_TOMAN: 10,
} as const;

/** پیش‌شماره موبایل ایران */
export const MOBILE_PREFIX = '09';

/** طول کد ملی و کد پستی ایران */
export const NATIONAL_CODE_LENGTH = 10;
export const POSTAL_CODE_LENGTH = 10;

/** نام اپ برای نمایش */
export const APP_NAME = 'یوما';
export const APP_NAME_EN = 'YUMA';
