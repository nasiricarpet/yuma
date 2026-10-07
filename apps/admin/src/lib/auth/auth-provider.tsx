'use client';

import { createContext, type ReactNode } from 'react';
import { useAuthStore } from './store';
import type { AdminUser } from './types';

export interface AuthContextValue {
  /** کاربر فعلی — null یعنی نشست باز نیست */
  user: AdminUser | null;
  /** توکن JWT */
  token: string | null;
  /** آیا کاربر وارد شده؟ */
  isAuthenticated: boolean;
  /** در حال بارگذاری اولیه */
  isLoading: boolean;
  /** ثبت نشست پس از ورود موفق */
  setSession: (user: AdminUser, token: string) => void;
  /** خروج و پاک‌سازی نشست */
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** مقدار پیش‌فرض context — قبل از mount store */
const defaultContext: AuthContextValue = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setSession: () => {},
  logout: () => {},
};

/**
 * Provider احراز هویت — نشست کاربر را در کل اپ فراهم می‌کند.
 * Zustand store به‌صورت خودکار در localStorage persist می‌شود.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, token, isLoading, setSession, clearSession } = useAuthStore();

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    setSession,
    logout: clearSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
