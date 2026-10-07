# راه‌اندازی محیط توسعه

## پیش‌نیازها

| ابزار | نسخه کمینه | بررسی |
| --- | --- | --- |
| Node.js | 20 (پیشنهادی: 24) | `node -v` |
| pnpm | 10.x | `pnpm -v` |
| Docker + Compose | هر نسخه اخیر | `docker compose version` |
| Git | 2.30+ | `git --version` |

فعال‌سازی pnpm:

```bash
corepack enable
corepack prepare pnpm@10.30.2 --activate
```

## ۱. نصب وابستگی‌ها

```bash
cd yuma
pnpm install
```

نکته: pnpm 10 به‌صورت پیش‌فرض اسکریپت‌های `postinstall` را مسدود می‌کند. پکیج‌های لازم (Prisma، esbuild، sharp و…) در `pnpm-workspace.yaml` زیر `onlyBuiltDependencies` فهرست شده‌اند. اگر پکیج جدیدی به این فهرست نیاز داشت، به همان کلید اضافه کنید و `pnpm install` را دوباره اجرا کنید.

فایل `.npmrc` با `shamefully-hoist=true` و `auto-install-peers=true` تنظیم شده تا Metro و React Native به‌درستی کار کنند.

## ۲. زیرساخت با Docker

```bash
docker compose up -d postgres redis mailhog
```

| سرویس | آدرس | توضیح |
| --- | --- | --- |
| PostgreSQL 16 | `localhost:5432` | کاربر/رمز/دیتابیس: `yuma` |
| Redis 7 | `localhost:6379` | کش و صف |
| Mailhog | SMTP `localhost:1025` / وب `localhost:8025` | دریافت ایمیل‌های توسعه |
| MinIO | `localhost:9000` / کنسول `localhost:9001` | اختیاری — با `--profile storage` |

اجرای MinIO:

```bash
docker compose --profile storage up -d minio
```

خاموش کردن و پاک کردن داده‌ها:

```bash
docker compose down          # نگه‌داشتن داده‌ها
docker compose down -v       # پاک کردن کامل داده‌ها
```

## ۳. دیتابیس

```bash
cp packages/db/.env.example packages/db/.env
pnpm db:generate     # تولید Prisma Client
pnpm db:push         # اعمال اسکیما روی دیتابیس محلی
pnpm db:seed         # داده نمونه فارسی
```

داده‌های seed:

| کاربر | شماره موبایل | نقش |
| --- | --- | --- |
| مدیر سیستم | `09120000000` | `ADMIN` |
| مدیر خشکشویی | `09120000001` | `LAUNDRY_MANAGER` |

رمز عبور نمونه: `admin1234` (فقط توسعه — در محیط تولید تغییر دهید).

## ۴. اجرای سرویس‌ها

همه با هم:

```bash
pnpm dev
```

هر کدام جداگانه:

```bash
pnpm --filter @yuma/api dev        # http://localhost:3001
pnpm --filter @yuma/admin dev      # http://localhost:3002
pnpm --filter @yuma/laundry dev    # http://localhost:3003
```

## ۵. اپ‌های موبایل

پکیج‌های مشترک را یک‌بار build کنید (Metro خروجی `dist` را می‌خواند):

```bash
pnpm --filter @yuma/persian build
pnpm --filter @yuma/validators build
pnpm --filter @yuma/types build
pnpm --filter @yuma/config build
pnpm --filter @yuma/ui build
# یا ساده‌تر:
pnpm build
```

سپس:

```bash
pnpm --filter @yuma/customer-app start
pnpm --filter @yuma/driver-app start
```

- برای اندروید/شبیه‌ساز: `pnpm --filter @yuma/customer-app android`
- برای iOS: `pnpm --filter @yuma/customer-app ios`
- اسکن QR با اپ Expo Go نیز کار می‌کند.

اسکریپت ریشه هم موجود است: `pnpm customer:dev` و `pnpm driver:dev`.

> تغییر `forceRTL` نیازمند یک‌بار reload اپ است. مقدار `extra.forcesRTL` در `app.json` این کار را از اولین اجرا تضمین می‌کند.

## ۶. تست و کیفیت کد

```bash
pnpm test          # تست همه پکیج‌ها
pnpm lint          # بررسی تایپ‌ها/لینت همه پکیج‌ها
pnpm format        # قالب‌بندی با Prettier
```

اجرای تست یک پکیج:

```bash
pnpm --filter @yuma/persian test
pnpm --filter @yuma/validators test
pnpm --filter @yuma/api test
```

## ۷. متغیرهای محیطی

برای هر اپ از فایل نمونه کپی بگیرید:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/laundry/.env.example apps/laundry/.env
cp packages/db/.env.example packages/db/.env
```

هیچ مقدار محرمانه‌ای در مخزن commit نمی‌شود؛ `.env` در `.gitignore` است.

### پروکسی در محیط‌های شرکتی

اگر پشت پروکسی هستید، مقادیر زیر را در `.env` بگذارید:

```env
HTTP_PROXY=http://proxy.corp:8080
HTTPS_PROXY=http://proxy.corp:8080
NO_PROXY=localhost,127.0.0.1,.local
```

- `NO_PROXY` را همیشه برای `localhost` و میزبان‌های داخلی تنظیم کنید تا ترافیک محلی از پروکسی عبور نکند.
- اعتبارسنجی گواهی (certificate) به‌صورت پیش‌فرض فعال است و نباید بدون دلیل خاموش شود.
- در NestJS برای درخواست‌های بیرونی از `HttpService` (بر پایه Axios) استفاده کنید و در صورت شکست، فقط لاگ بگیرید و جریان کاربر را متوقف نکنید.

## رفع اشکال‌های رایج

| نشانه | راه‌حل |
| --- | --- |
| `Prisma Client not generated` | `pnpm db:generate` |
| خطای اتصال دیتابیس | `docker compose ps` و بررسی پورت ۵۴۳۲ |
| `Cannot find module '@yuma/ui/native'` | پکیج‌ها را build کنید (`pnpm build`) |
| RTL اعمال نشد در موبایل | اپ را ری‌استارت کنید؛ `extra.forcesRTL` را در `app.json` بررسی کنید |
| نصب ناتمام به‌دلیل اسکریپت‌های مسدود | پکیج را به `onlyBuiltDependencies` اضافه کنید |
| فونت وزیرمتن لود نمی‌شود (وب) | دسترسی شبکه به Google Fonts یا استفاده از فایل محلی فونت |
