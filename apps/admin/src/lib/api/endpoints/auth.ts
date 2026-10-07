/**
 * endpoints و توابع ارتباط با بک‌اند برای احراز هویت
 *
 * مسیرها نسبت به `NEXT_PUBLIC_API_URL` تعریف می‌شوند (به `lib/api/client.ts` مراجعه کنید):
 *  - POST {NEXT_PUBLIC_API_URL}/auth/otp/request  → ارسال کد یکتا
 *  - POST {NEXT_PUBLIC_API_URL}/auth/otp/verify   → تأیید کد و دریافت توکن
 */
import { apiPost } from '../client';
import type { AdminUser } from '../../auth/types';

/** پاسخ موفق درخواست کد یکتا */
export interface OtpRequestResponse {
  /** پیام نمایشی برای کاربر */
  message?: string;
}

/** پاسخ موفق تأیید کد یکتا */
export interface OtpVerifyResponse {
  /** توکن JWT برای کلاینت API */
  token: string;
  /** کاربر وارد شده */
  user: {
    id: string;
    mobile: string;
    role: AdminUser['role'];
    fullName?: string;
  };
}

export const authEndpoints = {
  /** ارسال کد یکتای موبایل */
  sendOtp: '/auth/otp/request',
  /** درخواست کد یکتا (نام صریح) */
  requestOtp: '/auth/otp/request',
  /** تأیید کد یکتا و دریافت توکن */
  verifyOtp: '/auth/otp/verify',
  /** خروج از حساب */
  logout: '/auth/logout',
  /** پروفایل کاربر فعلی */
  me: '/users/me',
} as const;

/**
 * ارسال کد یکتا به شماره موبایل
 *
 * @example
 * await requestOtp('09123456789');
 */
export async function requestOtp(mobile: string): Promise<OtpRequestResponse> {
  return apiPost<OtpRequestResponse>(authEndpoints.requestOtp, { mobile });
}

/**
 * تأیید کد یکتا و دریافت توکن نشست
 *
 * @example
 * const { token, user } = await verifyOtp('09123456789', '123456');
 */
export async function verifyOtp(
  mobile: string,
  code: string,
): Promise<OtpVerifyResponse> {
  return apiPost<OtpVerifyResponse>(authEndpoints.verifyOtp, { mobile, code });
}
