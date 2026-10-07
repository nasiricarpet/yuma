# YUMA (یوما)

**سامانه خشکشویی آنلاین ایرانی** — یک Monorepo با پشتیبانی کامل از فارسی، RTL و تقویم هجری شمسی از روز اول.

> این پوشه کاملاً مستقل از پروژه Laravel موجود در ریشه مخزن است و هیچ‌کدام از فایل‌های آن را تغییر نمی‌دهد.

## نگاه کلی

| بخش | فناوری | پورت |
| --- | --- | --- |
| `apps/api` | NestJS 11 | 3001 |
| `apps/admin` | Next.js 15 (App Router) | 3002 |
| `apps/laundry` | Next.js 15 (App Router) | 3003 |
| `apps/customer-app` | React Native + Expo 52 | Metro |
| `apps/driver-app` | React Native + Expo 52 | Metro |

پکیج‌های مشترک:

| پکیج | کارکرد |
| --- | --- |
| `@yuma/persian` | ارقام، پول، تقویم جلالی، روزهای کاری |
| `@yuma/validators` | اسکیماهای Zod ایرانی (موبایل، کد ملی، کد پستی، IBAN، نام و متن فارسی) |
| `@yuma/types` | تایپ‌ها و برچسب‌های فارسی دامنه |
| `@yuma/config` | لوکال، منطقه زمانی، واحد پول، طول‌های اعتبارسنجی |
| `@yuma/db` | اسکیمای Prisma + کلاینت + seed |
| `@yuma/ui` | کامپوننت‌های React و React Native (شامل تقویم جلالی) |

## ساختار

```
yuma/
├── apps/
│   ├── api/              NestJS — API و منطق دامنه
│   ├── admin/            Next.js — پنل مدیریت
│   ├── laundry/          Next.js — پنل خشکشویی‌ها
│   ├── customer-app/     Expo — اپ مشتری
│   └── driver-app/       Expo — اپ راننده
├── packages/
│   ├── persian/          توابع بومی‌سازی ایرانی
│   ├── validators/       اعتبارسنجی ایرانی
│   ├── types/            تایپ‌های مشترک
│   ├── config/           پیکربندی مشترک
│   ├── db/               Prisma
│   └── ui/               کامپوننت‌های مشترک
├── docs/
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## شروع سریع

```bash
# ۱) پیش‌نیاز: Node >= 20 و pnpm 10 (corepack enable)
corepack enable
pnpm install

# ۲) زیرساخت توسعه
docker compose up -d postgres redis mailhog

# ۳) دیتابیس
cp packages/db/.env.example packages/db/.env
pnpm db:generate
pnpm db:push
pnpm db:seed

# ۴) اجرای همه سرویس‌ها
pnpm dev
```

- API: <http://localhost:3001/api> — مستندات Swagger: <http://localhost:3001/docs>
- سلامت و تاریخ شمسی: <http://localhost:3001/api/health>
- پنل مدیریت: <http://localhost:3002>
- پنل خشکشویی: <http://localhost:3003>
- صندوق نامه Mailhog: <http://localhost:8025>

> برای اپ‌های موبایل، ابتدا پکیج‌ها را یک‌بار build کنید (`pnpm build`) چون Metro خروجی `dist` پکیج‌ها را می‌خواند، سپس `pnpm --filter @yuma/customer-app start`.

## تست

```bash
pnpm test                                  # همه پکیج‌ها با Turborepo
pnpm --filter @yuma/persian test           # تست‌های بومی‌سازی
pnpm --filter @yuma/validators test        # تست‌های اعتبارسنجی
pnpm --filter @yuma/api test               # تست‌های API
```

## اصل‌های بومی‌سازی

- **UI:** `dir="rtl"`، `lang="fa-IR"`، فونت وزیرمتن.
- **تاریخ:** نمایش شمسی، ذخیره‌سازی میلادی ISO.
- **پول:** نمایش تومان، ذخیره‌سازی ریال (عدد صحیح).
- **اعداد:** ارقام فارسی در همه‌جا.
- **پیام‌ها:** همه پیام‌های خطا و اعتبارسنجی فارسی.

جزئیات بیشتر: [docs/setup.md](docs/setup.md) · [docs/architecture.md](docs/architecture.md) · [docs/persian-localization.md](docs/persian-localization.md) · [docs/conventions.md](docs/conventions.md)

## وضعیت

فاز ۰ (اسکلت Monorepo، بومی‌سازی، ابزارها) کامل است. آماده شروع فاز ۱ (بک‌اند: احراز هویت، سفارش، تخصیص، پرداخت).
