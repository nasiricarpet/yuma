'use client';

import { type ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { ToastProvider } from './toast-provider';
import { AuthProvider } from '../lib/auth/auth-provider';

/**
 * ترکیب همه providerهای سراسری اپ:
 * Theme → Query → Auth → Toast
 *
 * ترتیب مهم است: AuthProvider باید داخل QueryProvider باشد تا
 * کوئری‌ها بتوانند از وضعیت احراز هویت استفاده کنند.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          {children}
          <ToastProvider />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
