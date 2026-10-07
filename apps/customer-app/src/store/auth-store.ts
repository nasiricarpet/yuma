import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@yuma/types';

/** کلید ذخیره‌سازی استور در AsyncStorage */
const AUTH_STORAGE_KEY = 'yuma-auth-store';

/**
 * ورودی اکشن `login` — خروجی موفق احراز هویت از API
 */
export interface AuthPayload {
  user: User;
  token: string;
}

export interface AuthState {
  /** کاربر واردشده — تا زمان لاگین null است */
  user: User | null;
  /** توکن احراز هویت برای هدر Authorization */
  token: string | null;
  /** پرچم محاسبه‌شده برای گارد مسیرها */
  isAuthenticated: boolean;
  /** ذخیره کاربر و توکن پس از ورود/تأیید OTP */
  login: (payload: AuthPayload) => void;
  /** پاک کردن نشست و بازگشت به صفحه ورود */
  logout: () => void;
  /** به‌روزرسانی فقط توکن (مثلاً هنگام refresh) */
  setToken: (token: string) => void;
}

/**
 * استور مرکزی احراز هویت — با Zustand و Persist روی AsyncStorage.
 *
 * @example
 * const token = useAuthStore((state) => state.token);
 * const login = useAuthStore((state) => state.login);
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: ({ user, token }) =>
        set({ user, token, isAuthenticated: true }),
      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),
      setToken: (token) => set({ token }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      // فقط فیلدهای نششت ذخیره می‌شوند (اکشن‌ها خودکار سریال نمی‌شوند)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
