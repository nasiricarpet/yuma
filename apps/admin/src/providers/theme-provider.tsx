'use client';

import { type ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Provider تم — دارک‌مود کلاس‌محور با next-themes.
 * persisted و system به‌عنوان تم پیش‌فرض.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
