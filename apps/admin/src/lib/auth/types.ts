/** کاربر احراز هویت‌شده در پنل ادمین */
export interface AdminUser {
  /** شناسه کاربر */
  id: string;
  /** شماره موبایل */
  mobile: string;
  /** نقش کاربر — ادمین پنل فقط admin است */
  role: 'admin' | 'super_admin';
  /** نام نمایشی */
  fullName?: string;
}

/** پاسخ موفق ورود به پنل */
export interface AuthSession {
  user: AdminUser;
  /** توکن JWT */
  token: string;
}

/** اطلاعات فرم ورود */
export interface LoginFormValues {
  /** شماره موبایل ایرانی */
  mobile: string;
}

/** اطلاعات فرم کد یکتا */
export interface OtpFormValues {
  /** کد یکتای ۵ رقمی */
  code: string;
}
