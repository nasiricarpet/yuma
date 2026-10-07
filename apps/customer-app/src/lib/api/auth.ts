import { apiPost } from './client';
import type { User } from '@yuma/types';

/**
 * مسیرهای احراز هویت — نسبت به `EXPO_PUBLIC_API_URL`:
 *  - POST {EXPO_PUBLIC_API_URL}/auth/otp/request → ارسال کد یکتا
 *  - POST {EXPO_PUBLIC_API_URL}/auth/otp/verify  → تأیید کد و دریافت توکن
 */
export const authEndpoints = {
  /** ارسال کد یکتای موبایل */
  requestOtp: '/auth/otp/request',
  /** تأیید کد یکتا و دریافت توکن */
  verifyOtp: '/auth/otp/verify',
  /** خروج از حساب */
  logout: '/auth/logout',
} as const;

/** پاسخ موفق درخواست کد یکتا */
export interface OtpRequestResponse {
  /** پیام نمایشی برای کاربر */
  message?: string;
}

/** پاسخ موفق تأیید کد یکتا */
export interface OtpVerifyResponse {
  /** توکن نشست برای کلاینت API */
  token: string;
  /** کاربر واردشده */
  user: User;
}

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
