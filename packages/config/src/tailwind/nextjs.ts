import type { Config } from 'tailwindcss';

/**
 * رنگ‌های برند YUMA — پالت اختصاصی سامانه
 * پایه: آبی نیلی با لهجه‌های آبی روشن‌تر
 */
export const yumaColors = {
  50: '#eef4ff',
  100: '#d9e6ff',
  200: '#bcd3ff',
  300: '#8eb6ff',
  400: '#598dff',
  500: '#3366ff',
  600: '#1f47f5',
  700: '#1733e1',
  800: '#192bb6',
  900: '#1b2c8f',
  950: '#141b57',
} as const;

/**
 * اشیای پیکربندی Tailwind برای اپ‌های Next.js
 *
 * این preset تنظیمات مشترک همه اپ‌های Next را در بر می‌گیرد:
 *  - رنگ‌های برند YUMA
 *  - فونت Vazirmatn
 *  - متغیرهای CSS مخصوص shadcn/ui
 *  - دارک‌مود کلاس‌محور
 *
 * استفاده در tailwind.config.js اپ:
 * ```js
 * const { nextjsTailwindPreset } = require('@yuma/config/tailwind/nextjs');
 * module.exports = nextjsTailwindPreset({ content: [...] });
 * ```
 */
export function nextjsTailwindPreset(options: { content: string[] }): Config {
  return {
    darkMode: ['class'],
    content: options.content,
    theme: {
      container: {
        center: true,
        padding: '1.5rem',
        screens: { '2xl': '1400px' },
      },
      extend: {
        fontFamily: {
          sans: ['var(--font-vazirmatn)', 'Vazirmatn', 'Tahoma', 'sans-serif'],
        },
        colors: {
          yuma: yumaColors,
          border: 'hsl(var(--border))',
          input: 'hsl(var(--input))',
          ring: 'hsl(var(--ring))',
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          primary: {
            DEFAULT: 'hsl(var(--primary))',
            foreground: 'hsl(var(--primary-foreground))',
          },
          secondary: {
            DEFAULT: 'hsl(var(--secondary))',
            foreground: 'hsl(var(--secondary-foreground))',
          },
          destructive: {
            DEFAULT: 'hsl(var(--destructive))',
            foreground: 'hsl(var(--destructive-foreground))',
          },
          muted: {
            DEFAULT: 'hsl(var(--muted))',
            foreground: 'hsl(var(--muted-foreground))',
          },
          accent: {
            DEFAULT: 'hsl(var(--accent))',
            foreground: 'hsl(var(--accent-foreground))',
          },
          popover: {
            DEFAULT: 'hsl(var(--popover))',
            foreground: 'hsl(var(--popover-foreground))',
          },
          card: {
            DEFAULT: 'hsl(var(--card))',
            foreground: 'hsl(var(--card-foreground))',
          },
          success: {
            DEFAULT: 'hsl(var(--success))',
            foreground: 'hsl(var(--success-foreground))',
          },
          warning: {
            DEFAULT: 'hsl(var(--warning))',
            foreground: 'hsl(var(--warning-foreground))',
          },
        },
        borderRadius: {
          lg: 'var(--radius)',
          md: 'calc(var(--radius) - 2px)',
          sm: 'calc(var(--radius) - 4px)',
        },
        keyframes: {
          'accordion-down': {
            from: { height: '0' },
            to: { height: 'var(--radix-accordion-content-height)' },
          },
          'accordion-up': {
            from: { height: 'var(--radix-accordion-content-height)' },
            to: { height: '0' },
          },
        },
        animation: {
          'accordion-down': 'accordion-down 0.2s ease-out',
          'accordion-up': 'accordion-up 0.2s ease-out',
        },
      },
    },
    plugins: [require('tailwindcss-animate'), require('tailwindcss-rtl')],
  };
}

/** تنظیمات پیش‌فرض برای اپ‌های Next.js — محتوای استاندارد */
export const nextjsContentPaths = [
  './app/**/*.{ts,tsx}',
  './components/**/*.{ts,tsx}',
  './lib/**/*.{ts,tsx}',
  './src/app/**/*.{ts,tsx}',
  './src/components/**/*.{ts,tsx}',
  './src/lib/**/*.{ts,tsx}',
];
