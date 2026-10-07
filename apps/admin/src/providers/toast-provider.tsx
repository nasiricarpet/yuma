'use client';

import { Toaster } from 'sonner';

/**
 * Provider اعلان‌ها — sonner Toaster با تنظیمات RTL فارسی
 *
 * position در گوشه پایین-راست برای راست‌به‌چپ مناسب است.
 */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-left"
      dir="rtl"
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: 'var(--font-vazirmatn), Tahoma, sans-serif',
        },
      }}
    />
  );
}
