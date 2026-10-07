import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import { APP_DIR, APP_LOCALE, APP_NAME } from '@yuma/config';
import './globals.css';

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-vazirmatn',
});

export const metadata: Metadata = {
  title: `پنل خشکشویی | ${APP_NAME}`,
  description: 'سامانه مدیریت سفارش‌های خشکشویی یوما',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={APP_LOCALE} dir={APP_DIR} className={vazirmatn.variable}>
      <body>{children}</body>
    </html>
  );
}
