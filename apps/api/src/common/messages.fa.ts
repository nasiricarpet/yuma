/**
 * پیام‌های خطای سراسری فارسی — منبع واحد برای API
 */
export const faMessages = {
  common: {
    notFound: 'منبع مورد نظر یافت نشد',
    unauthorized: 'ابتدا وارد حساب خود شوید',
    forbidden: 'شما به این بخش دسترسی ندارید',
    validation: 'اطلاعات ارسالی نامعتبر است',
    internal: 'خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید',
    throttled: 'درخواست‌های بیش از حد. کمی صبر کنید',
  },
  auth: {
    invalidCredentials: 'شماره موبایل یا رمز عبور اشتباه است',
    tokenExpired: 'جلسه شما منقضی شده است. دوباره وارد شوید',
    otpRateLimited: 'درخواست کد تأیید بیش از حد مجاز است. کمی صبر کنید',
    otpInvalid: 'کد تأیید واردشده اشتباه است',
    otpExpired: 'کد تأیید منقضی شده است. دوباره درخواست کنید',
  },
  order: {
    notFound: 'سفارش یافت نشد',
    invalidTransition: 'تغییر وضعیت سفارش در این مرحله امکان‌پذیر نیست',
    notCancellable: 'لغو سفارش در این مرحله امکان‌پذیر نیست',
    emptyItems: 'سفارش باید حداقل یک قلم خدمات داشته باشد',
  },
  laundry: {
    notFound: 'پروفایل قالیشویی شما یافت نشد',
  },
  driver: {
    notFound: 'پروفایل سفیر شما یافت نشد',
  },
  assignment: {
    notFound: 'وظیفه مورد نظر یافت نشد',
  },
  quotation: {
    notFound: 'پیش‌فاکتور این سفارش وجود ندارد',
    notSent: 'پیش‌فاکتور در وضعیت ارسال‌شده نیست',
    exists: 'برای این سفارش قبلاً پیش‌فاکتور ثبت شده است',
  },
  payment: {
    notFound: 'تراکنش پرداخت یافت نشد',
    alreadyProcessed: 'این تراکنش قبلاً پردازش شده است',
    verifyFailed: 'تأیید پرداخت ناموفق بود',
  },
  user: {
    addressLimit: 'حداکثر ۵ آدرس می‌توانید ثبت کنید',
    addressNotFound: 'آدرس مورد نظر یافت نشد',
    nationalCodeExists: 'کد ملی قبلاً توسط کاربر دیگری ثبت شده است',
  },
} as const;

export type FaMessages = typeof faMessages;
