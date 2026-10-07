import { apiPost } from '../client';
import type { Driver } from '@yuma/types';

/**
 * مسیرهای احراز هویت سفیر — نسبت به `EXPO_PUBLIC_API_URL`:
 *  - POST {EXPO_PUBLIC_API_URL}/auth/driver/otp/request → ارسال کد یکتا
 *  - POST {EXPO_PUBLIC_API_URL}/auth/driver/otp/verify  → تأیید کد و دریافت توکن
 */
export const driverAuthEndpoints = {
  /** ارسال کد یکتای موبایل سفیر */
  requestOtp: '/auth/driver/otp/request',
  /** تأیید کد یکتا و دریافت توکن */
  verifyOtp: '/auth/driver/otp/verify',
  /** خروج از حساب */
  logout: '/auth/driver/logout',
} as const;

/** پاسخ موفق درخواست کد یکتا */
export interface OtpRequestResponse {
  /** پیام نمایشی برای سفیر */
  message?: string;
}

/** پاسخ موفق تأیید کد یکتا */
export interface DriverOtpVerifyResponse {
  /** توکن نشست برای کلاینت API */
  token: string;
  /** پروفایل سفیر واردشده */
  driver: Driver;
}

/**
 * ارسال کد یکتا به شماره موبایل سفیر
 *
 * @example
 * await requestOtp('09123456789');
 */
export async function requestOtp(mobile: string): Promise<OtpRequestResponse> {
  return apiPost<OtpRequestResponse>(driverAuthEndpoints.requestOtp, { mobile });
}

/**
 * تأیید کد یکتا و دریافت توکن نشست سفیر
 *
 * @example
 * const { token, driver } = await verifyOtp('09123456789', '123456');
 */
export async function verifyOtp(
  mobile: string,
  code: string,
): Promise<DriverOtpVerifyResponse> {
  return apiPost<DriverOtpVerifyResponse>(driverAuthEndpoints.verifyOtp, {
    mobile,
    code,
  });
}
