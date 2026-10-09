/**
 * endpoints و توابع ارتباط با بک‌اند برای احراز هویت
 *
 * مسیرها نسبت به `NEXT_PUBLIC_API_URL` تعریف می‌شوند (به `lib/api/client.ts` مراجعه کنید):
 *  - POST {NEXT_PUBLIC_API_URL}/otp/request  → ارسال کد یکتا
 *  - POST {NEXT_PUBLIC_API_URL}/otp/verify   → تأیید کد و دریافت توکن
 *
 * توجه: API خروجی `{ accessToken, refreshToken }` می‌دهد، در حالی که صفحه ورود
 * انتظار `{ token, user }` دارد — `verifyOtp` این تبدیل را انجام می‌دهد.
 */
import type { AdminUser } from '../../auth/types';
import { apiGet, apiPost, TOKEN_KEY } from '../client';
import { setStorage } from '@/lib/utils/storage';

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
  sendOtp: '/otp/request',
  /** درخواست کد یکتا (نام صریح) */
  requestOtp: '/otp/request',
  /** تأیید کد یکتا و دریافت توکن */
  verifyOtp: '/otp/verify',
  /** خروج از حساب */
  logout: '/logout',
  /** پروفایل کاربر فعلی */
  me: '/me',
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
 * خروجی API شامل `accessToken`/`refreshToken` است که در اینجا به شکل
 * `{ token, user }` که صفحه ورود انتظار دارد تبدیل می‌شود.
 *
 * @example
 * const { token, user } = await verifyOtp('09123456789', '123456');
 */
export async function verifyOtp(
  mobile: string,
  code: string,
): Promise<OtpVerifyResponse> {
  const tokens = await apiPost<{
    ok: boolean;
    accessToken: string;
    refreshToken: string;
  }>(authEndpoints.verifyOtp, { mobile, code });

  if (!tokens.accessToken) {
    throw new Error('verify failed');
  }

  setStorage(TOKEN_KEY, tokens.accessToken);
  setStorage('yuma-refresh-token', tokens.refreshToken);

  const user = await apiGet<{
    id: string;
    mobile: string;
    role: AdminUser['role'];
    fullName?: string;
  }>(authEndpoints.me);

  return {
    token: tokens.accessToken,
    user,
  };
}
