'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from './auth-store';

/**
 * گارد مسیرهای محافظت‌شده —
 * وضعیت احراز هویت را مستقیماً از Zustand store می‌خواند و اگر کاربر
 * وارد نشده باشد، او را به `/login` هدایت می‌کند.
 *
 * بررسی پس از mount کلاینت انجام می‌شود تا حالت persist شده در
 * `localStorage` پیش از تصمیم‌گیری درباره redirect هیدراته شود.
 * در سرور و اولین رندر، `null` برمی‌گردد تا از redirect اشتباه جلوگیری شود.
 *
 * @example
 * <ProtectedRoute><DashboardPage /></ProtectedRoute>
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = useAuthStore((state) => Boolean(state.user && state.token));

  // نشست از localStorage هیدراته می‌شود — فقط در کلاینت
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, router]);

  // تا قبل از mount یا در صورت عدم احراز هویت چیزی رندر نمی‌کنیم
  if (!mounted || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
