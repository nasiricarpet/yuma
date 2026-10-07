'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser } from './types';

interface AuthState {
  /** کاربر فعلی — null یعنی نشست باز نیست */
  user: AdminUser | null;
  /** توکن JWT */
  token: string | null;
  /** در حال پردازش درخواست احراز هویت */
  isLoading: boolean;
  /** ثبت نشست پس از ورود موفق */
  setSession: (user: AdminUser, token: string) => void;
  /** خروج از حساب — پاک کردن نشست */
  clearSession: () => void;
  /** تنظیم حالت بارگذاری */
  setLoading: (loading: boolean) => void;
}

/**
 * Zustand store احراز هویت پنل ادمین
 *
 * با میان‌افزار `persist` در `localStorage` (کلید `yuma-admin-auth`) ذخیره می‌شود،
 * پس نشست کاربر پس از رفرش هم حفظ می‌شود. فقط `user` و `token` ذخیره می‌شوند.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      setSession: (user, token) => set({ user, token, isLoading: false }),
      clearSession: () => set({ user: null, token: null, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'yuma-admin-auth',
      // فقط user و token ذخیره می‌شوند، نه isLoading
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);
