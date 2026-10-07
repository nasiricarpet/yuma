# فونت‌های Vazirmatn

فایل‌های وزن مختلف فونت **وزیرمتن** در این پوشه قرار می‌گیرند.
دانلود از [rastikerdar/vazirmatn](https://github.com/rastikerdar/vazirmatn/releases).

## فایل‌های مورد انتظار

| فایل                     | وزن |
| ------------------------ | --- |
| `Vazirmatn-Light.woff2`  | 300 |
| `Vazirmatn-Regular.woff2`| 400 |
| `Vazirmatn-Medium.woff2` | 500 |
| `Vazirmatn-SemiBold.woff2`| 600 |
| `Vazirmatn-Bold.woff2`   | 700 |

## نکته

فونت اصلی از طریق `next/font/google` در `src/app/layout.tsx` بارگذاری می‌شود و
این فایل‌ها تنها **fallback** محلی هستند (تعریف `@font-face` در `src/app/globals.css`).
در صورت نبودن فایل‌ها مشکلی پیش نمی‌آید — فقط fallback اجرا نمی‌شود.
