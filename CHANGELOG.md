# Changelog

تغییرات پروژه YUMA (یوما) — سامانه خشکشویی آنلاین

## [0.2.0] — ۱۴۰۵/۰۷/۱۶

هدف: اجرای پروژه روی Node.js 20.20، pnpm 10 و سرور ایران (بدون VPN)،
رفع خطاهای build و کار کردن ورود با OTP.

### پیکربندی Monorepo

- **`pnpm-workspace.yaml`**: `bcrypt` به `onlyBuiltDependencies` اضافه شد تا
  بتواند اسکریپت build نیتیو خود را اجرا کند (در غیر این صورت پروژه بالا نمی‌آمد).
  → فایل: [`pnpm-workspace.yaml`](pnpm-workspace.yaml)
- **`package.json` ریشه**: `engines` به `node >= 20.20.0` و `pnpm >= 10.0.0` ارتقا یافت.
- **`.nvmrc`**: ساخته شد با `20.20.0` (`nvm use`).

### پکیج‌های مشترک

- **`@yuma/constants`**: فایل `src/index.ts` به‌عنوان placeholder ساخته شد
  (`pnpm dev` به نبود آن خطا می‌داد).
  → [`packages/constants/src/index.ts`](packages/constants/src/index.ts)
- **`@yuma/db`**: `tsconfig.json` اصلاح شد — `rootDir` از `.` به `src` و حذف
  `prisma/seed.ts` از `include`. خروجی build حالا `dist/index.js` است (قبلاً
  `dist/src/index.js` ساخته می‌شد و `main` پکیج به فایل اشتباه اشاره می‌کرد).
  → [`packages/db/tsconfig.json`](packages/db/tsconfig.json)
- **`@yuma/ui`**:
  - `JalaliDatePicker.tsx`: دستور `"use client";` به ابتدای فایل اضافه شد
    (استفاده از `useState` در Next.js App Router).
  - باگ destructuring در `prevMonth`/`nextMonth` اصلاح شد: حالا از
    `setView((prev) => ...)` با spread استفاده می‌کنند تا پراپرتی `jd` در state
    حفظ شود (قبلاً افت می‌شد و TypeScript خطا می‌گرفت).
  - `nativewind-env.d.ts` ساخته شد برای فعال‌سازی پراپ `className` روی
    کامپوننت‌های React Native در خروجی DTS.
  → [`packages/ui/src/JalaliDatePicker.tsx`](packages/ui/src/JalaliDatePicker.tsx)

### اپ API (NestJS)

- **`tsconfig.json`**: کلید `paths` حذف و `moduleResolution: "node"` اضافه شد.
  TypeScript دیگر ریشه پروژه را monorepo حساب نمی‌کند و وابستگی‌های `@yuma/*`
  از `node_modules` (خروجی build شده) resolve می‌شوند.
- **`nest-cli.json`**: بدون `entryFile` (مطابق هدف نهایی).
- **`@nestjs/passport`**: از `^12.0.0` به `^11.0.0` downgrade شد — نسخه ۱۲
  pure ESM است و با CommonJS پروژه سازگار نیست (خطای `ERR_REQUIRE_ESM`).
- **`OtpService`**: `OTP_TTL_SECONDS` از ۱۲۰ (۲ دقیقه) به ۶۰۰ (۱۰ دقیقه) تغییر کرد.
- **ماژول ایمیل جدید** در [`apps/api/src/common/mail/`](apps/api/src/common/mail/):
  - `MailService` با nodemailer: در محیط توسعه **بدون SMTP** کد را فقط log می‌کند،
    در غیر این صورت از طریق SMTP (MailHog روی `localhost:1025`) ارسال می‌کند.
  - `MailModule` به‌صورت `@Global()` در `AppModule` ثبت شد تا `OtpService`
    بتواند `MailService` را تزریق کند.
  - `OtpService.request()` بعد از ذخیره در Redis، کد را از طریق ایمیل می‌فرستد.
  - پکیج‌های `nodemailer` و `@types/nodemailer` اضافه شدند.
- **تست‌ها**: `otp.service.spec.ts` برای constructor جدید و TTL جدید به‌روز شد
  (۹/۹ تست پاس می‌شود).

### اپ ادمین (Next.js)

- **`lib/api/endpoints/auth.ts`** بازنویسی شد:
  - مسیرها از `/auth/otp/request` به `/otp/request` و `/auth/otp/verify` به
    `/otp/verify` اصلاح شدند (مطابق مسیرهای واقعی API)، `me` به `/me`،
    `logout` به `/logout`.
  - آداپتور `verifyOtp`: API خروجی `{ accessToken, refreshToken }` می‌دهد ولی
    صفحه OTP انتظار `{ token, user }` دارد — تبدیل انجام می‌شود، توکن‌ها در
    localStorage ذخیره می‌شوند و سپس پروفایل از `/me` گرفته می‌شود.
  → [`apps/admin/src/lib/api/endpoints/auth.ts`](apps/admin/src/lib/api/endpoints/auth.ts)
- **فایل‌های env**: `.env.example` و `.env.local.example` با قالب کامل و
  placeholder آدرس سرور (`YOUR_SERVER_IP`) بازنویسی شدند؛ `.env.local` برای
  توسعه محلی (localhost) ساخته شد.

### اپ خشکشویی (Next.js)

- **`app/page.tsx`**: `"use client";` اضافه شد — این صفحه `onChange` به
  `JalaliDatePicker` (که حالا Client Component است) پاس می‌داد و با خطای
  "Event handlers cannot be passed to Client Component props" مواجه می‌شد.
- اصلاح یک باگ از‌پیش‌موجود: مقدار نامعتبر `status: 'in_progress'` در داده‌های
  نمونه به `'washing'` (یکی از اعضای معتبر `OrderStatus`) تغییر کرد.
- **`.eslintrc.json`** ساخته شد (`next/core-web-vitals` + `next/typescript`) —
  بدون آن `next build` با Parsing error متوقف می‌شد.
- فایل‌های env مانند اپ ادمین.

### اپ‌های موبایل (Expo)

- **`customer-app`** و **`driver-app`**: فایل‌های `.env.example` با قالب کامل و
  `EXPO_PUBLIC_API_URL=http://YOUR_SERVER_IP:3001/api` بازنویسی شدند.

### مستندات

- **`README.md`**: بخش «پیش‌نیازها» و «نکات مهم برای کاربران ایران» (میرورهای
  kargadan، mirror-nodejs، docker arvancloud) و بخش «استقرار روی سرور» اضافه شد.

### نتیجه بررسی

| بررسی | وضعیت |
| --- | --- |
| `pnpm install` (با bcrypt و nodemailer) | ✅ |
| build همه پکیج‌ها | ✅ |
| `@yuma/api` typecheck + `nest build` | ✅ |
| `@yuma/api` تست‌ها | ✅ ۹/۹ |
| `@yuma/admin` lint + build | ✅ |
| `@yuma/laundry` typecheck + build | ✅ |
| `@yuma/customer-app` / `driver-app` typecheck | ✅ |
