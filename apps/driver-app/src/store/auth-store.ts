import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Driver } from '@yuma/types';

/** کلید ذخیره‌سازی استور در AsyncStorage (متمایز از اپ مشتری) */
const AUTH_STORAGE_KEY = 'yuma-driver-auth-store';

/**
 * ورودی اکشن `login` — خروجی موفق احراز هویت سفیر از API
 */
export interface DriverAuthPayload {
  driver: Driver;
  token: string;
}

export interface DriverAuthState {
  /** سفیر واردشده — تا زمان لاگین null است */
  driver: Driver | null;
  /** توکن احراز هویت برای هدر Authorization */
  token: string | null;
  /** پرچم محاسبه‌شده برای گارد مسیرها */
  isAuthenticated: boolean;
  /** ذخیره سفیر و توکن پس از تأیید OTP */
  login: (payload: DriverAuthPayload) => void;
  /** پاک کردن نشست و بازگشت به صفحه ورود */
  logout: () => void;
  /** به‌روزرسانی فقط توکن (مثلاً هنگام refresh) */
  setToken: (token: string) => void;
}

/**
 * استور مرکزی احراز هویت سفیر — با Zustand و Persist روی AsyncStorage.
 *
 * @example
 * const token = useAuthStore((state) => state.token);
 * const login = useAuthStore((state) => state.login);
 */
export const useAuthStore = create<DriverAuthState>()(
  persist(
    (set) => ({
      driver: null,
      token: null,
      isAuthenticated: false,
      login: ({ driver, token }) =>
        set({ driver, token, isAuthenticated: true }),
      logout: () =>
        set({ driver: null, token: null, isAuthenticated: false }),
      setToken: (token) => set({ token }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      // فقط فیلدهای نشست ذخیره می‌شوند (اکشن‌ها خودکار سریال نمی‌شوند)
      partialize: (state) => ({
        driver: state.driver,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
