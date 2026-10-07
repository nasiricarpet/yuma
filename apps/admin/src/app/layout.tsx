import type { Metadata, Viewport } from 'next';
import { Vazirmatn } from 'next/font/google';
import { APP_DIR, APP_LOCALE, APP_NAME } from '@yuma/config';
import { Providers } from '@/providers';
import './globals.css';

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-vazirmatn',
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} | پنل مدیریت`,
    template: `%s | ${APP_NAME}`,
  },
  description: 'پنل مدیریت سامانه خشکشویی یوما',
  applicationName: APP_NAME,
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // lang و dir از روز اول فارسی و راست‌به‌چپ هستند
    <html
      lang={APP_LOCALE}
      dir={APP_DIR}
      className={vazirmatn.variable}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
