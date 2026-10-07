import type { Config } from 'tailwindcss';
import { nextjsTailwindPreset } from '@yuma/config/tailwind/nextjs';

/**
 * پیکربندی Tailwind پنل ادمین یوما
 *
 * preset مشترک از `@yuma/config/tailwind/nextjs` شامل:
 *  - رنگ‌های برند yuma + متغیرهای CSS شادکن
 *  - فونت Vazirmatn
 *  - دارک‌مود کلاس‌محور
 *  - پلاگین‌های tailwindcss-animate و tailwindcss-rtl
 *
 * فقط مسیرهای content این اپ را اضافه می‌کنیم.
 */
const config: Config = nextjsTailwindPreset({
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './public/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
});

export default config;
