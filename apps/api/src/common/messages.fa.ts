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
    reasonRequired: 'دلیل این تغییر وضعیت الزامی است',
    notAssignedToWorkshop: 'این سفارش هنوز به کارگاه شما تخصیص نیافته است',
    notAssignedToDriver: 'این سفارش به سفیر شما تخصیص نیافته است',
    duplicateIdempotencyKey: 'سفارش با این کلید یکتا قبلاً ثبت شده است',
    invalidStatus: 'وضعیت سفارش نامعتبر است',
  },
  laundry: {
    notFound: 'پروفایل قالیشویی شما یافت نشد',
  },
  support: {
    ticketNotFound: 'تیکت مورد نظر یافت نشد',
    ticketClosed: 'این تیکت بسته شده است. برای ادامه یک تیکت جدید ثبت کنید',
    agentNotFound: 'کارشناس پشتیبانی مورد نظر یافت نشد',
    notSupportAgent: 'این کاربر نقش پشتیبانی ندارد',
    agentInactive: 'این کاربر غیرفعال است و نمی‌تواند تیکت دریافت کند',
    invalidTransition: 'تغییر وضعیت تیکت از حالت فعلی امکان‌پذیر نیست',
    messageRequired: 'متن پیام الزامی است',
    alreadyAssigned: 'این تیکت قبلاً به این کارشناس تخصیص داده شده است',
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
    mobileExists: 'شماره موبایل قبلاً ثبت شده است',
    emailExists: 'ایمیل قبلاً توسط کاربر دیگری ثبت شده است',
    cannotDeleteSelf: 'نمی‌توانید حساب کاربری خودتان را حذف کنید',
    cannotChangeOwnRole: 'نمی‌توانید نقش حساب کاربری خودتان را تغییر دهید',
    cannotDeleteLastAdmin: 'آخرین مدیر سیستم را نمی‌توان حذف کرد',
    alreadyDeleted: 'این کاربر قبلاً حذف شده است',
    lastAdmin: 'آخرین مدیر سیستم را نمی‌توان تغییر داد',
  },
} as const;

export type FaMessages = typeof faMessages;
