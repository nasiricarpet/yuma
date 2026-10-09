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

## پیش‌نیازها

- Node.js >= 20.20.0 (توصیه: 20.20 LTS)
- pnpm >= 10.0.0
- Docker + docker-compose
- PostgreSQL 15+ (یا از طریق Docker)
- Redis 7+ (یا از طریق Docker)

> نسخه دقیق Node در فایل [`.nvmrc`](.nvmrc) قفل شده است — با `nvm use` فعال می‌شود.

## نکات مهم برای کاربران ایران

- برای دانلود پکیج‌ها از میرورهای داخلی استفاده کنید:

  ```bash
  npm config set registry https://mirror.kargadan.ir/repository/npm-group/
  pnpm config set registry https://mirror.kargadan.ir/repository/npm-group/
  ```

- برای باینری Node.js: <https://mirror-nodejs.runflare.com/dist/>

- برای Docker images، در `/etc/docker/daemon.json` اضافه کنید:

  ```json
  {
    "registry-mirrors": ["https://docker.arvancloud.ir"]
  }
  ```

## شروع سریع

```bash
# ۱) پیش‌نیاز: Node >= 20.20.0 و pnpm 10 (corepack enable)
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

## استقرار روی سرور

روی سرور ایران، همه اپ‌ها از طریق متغیرهای محیطی به API متصل می‌شوند.

```bash
# ۱) کلون و نصب
 git clone <repo> && cd yuma
corepack enable
pnpm install

# ۲) زیرساخت (PostgreSQL + Redis + MailHog)
docker compose up -d postgres redis mailhog

# ۳) دیتابیس
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed

# ۴) build همه پکیج‌ها و اپ‌ها
pnpm build

# ۵) اجرای سرویس‌ها (هرکدام در یک سرویس/systemd جدا)
pnpm --filter @yuma/api start               # API روی پورت ۳۰۰۱
pnpm --filter @yuma/admin start             # پنل ادمین روی پورت ۳۰۰۲
pnpm --filter @yuma/laundry start           # پنل خشکشویی روی پورت ۳۰۰۳
```

سپس در فایل‌های `.env.production` هر اپ، IP سرور را تنظیم کنید:

| اپ | فایل | نمونه |
| --- | --- | --- |
| api | `.env` | `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `SMTP_*` |
| admin | `.env.production` | `NEXT_PUBLIC_API_URL=http://SERVER_IP:3001/api` |
| laundry | `.env.production` | `NEXT_PUBLIC_API_URL=http://SERVER_IP:3001/api` |
| customer-app / driver-app | `.env` | `EXPO_PUBLIC_API_URL=http://SERVER_IP:3001/api` |

> الگوی آماده در فایل‌های `.env.example` هر اپ وجود دارد — `cp .env.example .env.production`.

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
