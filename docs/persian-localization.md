# بومی‌سازی ایرانی

این سند مرجع «چطور درست فارسی بنویسیم» در پروژه YUMA است.

## اصول پنج‌گانه

1. **متن:** همه رشته‌های کاربرپسند فارسی هستند.
2. **جهت:** همه‌جا RTL.
3. **عدد:** ارقام فارسی (۰۱۲۳۴۵۶۷۸۹).
4. **تاریخ:** نمایش شمسی، ذخیره‌سازی میلادی.
5. **پول:** نمایش تومان، ذخیره‌سازی ریال.

## ارقام فارسی

```ts
import { toPersianDigits, toEnglishDigits } from '@yuma/persian';

toPersianDigits('1405/07/08');   // «۱۴۰۵/۰۷/۰۸»
toEnglishDigits('۰۹۱۲۳۴۵۶۷۸۹'); // «09123456789»
```

`toEnglishDigits` هم ارقام فارسی (`U+06F0–U+06F9`) و هم ارقام عربی (`U+0660–U+0669`) را به لاتین تبدیل می‌کند — لازم است چون کیبوردهای مختلف موبایل هر دو را تولید می‌کنند.

**همیشه پیش از ذخیره یا اعتبارسنجی، ورودی کاربر را به لاتین تبدیل کنید.**

## پول

```ts
import { formatCurrency, formatDecimal } from '@yuma/persian';

formatCurrency(1250000);        // «۱٬۲۵۰٬۰۰۰ تومان»
formatCurrency(1250000, 'rial'); // «۱٬۲۵۰٬۰۰۰ ریال»
formatDecimal(1234567.891);      // «۱٬۲۳۴٬۵۶۷٫۸۹»
```

- جداکننده هزارگان: `٬` (U+066C) — **نه** کاما لاتین.
- جداکننده اعشار: `٫` (U+066B) — **نه** نقطه لاتین.
- علامت منفی: `-` لاتین، پیش از عدد.

### قاعده تبدیل ریال/تومان

| کاربرد | واحد | نوع داده |
| --- | --- | --- |
| دیتابیس، API، محاسبات مالی | ریال (IRR) | `Int` |
| نمایش به کاربر | تومان (IRT) | مشتق‌شده |

```ts
// ۱ تومان = ۱۰ ریال
const toToman = (rial: number) => Math.round(rial / 10);
const toRial  = (toman: number) => toman * 10;
```

**هرگز مبلغ را به‌صورت اعشاری ذخیره نکنید.** منبع حقیقت نرخ تبدیل: `CURRENCY.RIAL_PER_TOMAN` در `@yuma/config`.

## تقویم هجری شمسی

پیاده‌سازی داخلی بر پایه **JDN (شماره روز جولیَن)** است و هیچ وابستگی بیرونی ندارد. نقطه لنگر: ۱ فروردین ۱۴۰۳ = ۲۰ مارس ۲۰۲۴ = JDN 2460390.

```ts
import {
  toJalali, toGregorian, formatJalaliDate, parseJalaliDateString,
  getJalaliMonthName, getJalaliDayName,
  isJalaliLeap, jalaliMonthLength, calculateBusinessDays,
} from '@yuma/persian';

toJalali(new Date('2026-10-01'));          // { jy: 1405, jm: 7, jd: 9 }
toGregorian(1405, 7, 9);                    // Date معادل میلادی
formatJalaliDate(new Date(), 'dddd D MMMM YYYY'); // «پنجشنبه ۹ مهر ۱۴۰۵»
parseJalaliDateString('1405/07/08');        // Date (نیمه‌شب UTC)
```

### توکن‌های قالب‌بندی

| توکن | معنی | نمونه |
| --- | --- | --- |
| `YYYY` | سال چهاررقمی | ۱۴۰۵ |
| `YY` | سال دورقمی | ۰۵ |
| `MMMM` | نام ماه | مهر |
| `MM` | ماه دو رقمی | ۰۷ |
| `DD` | روز دو رقمی | ۰۸ |
| `dddd` | نام روز هفته | شنبه |
| `HH` / `mm` | ساعت و دقیقه (فقط ورودی `Date`) | ۱۴:۳۰ |

### نکات مهم تقویم

- **سال کبیسه:** چرخه ۳۳ ساله؛ باقی‌مانده‌های کبیسه `1, 5, 9, 13, 17, 22, 26, 30`.
- **نخستین روز هفته:** شنبه (اندیس ۰) تا جمعه (اندیس ۶).
- **ورودی `Date`:** از اجزای **UTC** استفاده می‌شود تا نتیجه مستقل از timezone محلی باشد. اگر می‌خواهید زمان تهران را ببینید، تاریخ را در سرور با `TZ=Asia/Tehran` بسازید.

### روزهای کاری

```ts
import { calculateBusinessDays } from '@yuma/persian';

calculateBusinessDays(
  { jy: 1405, jm: 7, jd: 1 },
  { jy: 1405, jm: 7, jd: 30 },
  [{ jy: 1405, jm: 7, jd: 9 }],       // تعطیلات رسمی
  { thursdayWorkday: false },          // پنجشنبه تعطیل (پیش‌فرض)
);
```

- جمعه همیشه تعطیل است.
- پنجشنبه با پیش‌فرض تعطیل و با `thursdayWorkday: true` کاری می‌شود.
- هر دو سر بازه شمرده می‌شوند؛ بازه معکوس صفر برمی‌گرداند.

## اعتبارسنجی ایرانی

```ts
import {
  mobileSchema, nationalCodeSchema, postalCodeSchema,
  ibanSchema, persianNameSchema, persianTextSchema,
} from '@yuma/validators';

mobileSchema.parse('۰۹۱۲۳۴۵۶۷۸۹');            // «09123456789»
mobileSchema.parse('+989123456789');            // «09123456789»
nationalCodeSchema.safeParse('1234567890');     // بررسی checksum
ibanSchema.parse('IR820540102680020817909002'); // MOD-97
persianNameSchema.parse('زهرا محمدی');
persianTextSchema.parse('یادداشت مشتری');
```

| اسکیما | قاعده |
| --- | --- |
| موبایل | پیش‌شماره `+98`/`0098`/`98` → `0`؛ الگوی `^09\d{9}$` |
| کد ملی | ۱۰ رقم + checksum (وزن ۱۰ تا ۲، باقی‌مانده تقسیم بر ۱۱)؛ کدهای با ارقام یکسان رد می‌شوند |
| کد پستی | ۱۰ رقم + نرمال‌سازی ارقام فارسی و حذف خط تیره |
| IBAN | `^IR\d{24}$` + بازبینی MOD-97 |
| نام فارسی | ۲ تا ۶۰ نویسه، شامل حرف فارسی، نیم‌فاصله (`\u200C`) و فاصله |
| متن فارسی | پیش‌فرض ۱ تا ۱۰۰۰ نویسه؛ قابل تنظیم با `createPersianTextSchema` |

همه پیام‌های خطا فارسی هستند و مستقیماً قابل نمایش به کاربر.

## وب (Next.js)

```tsx
// app/layout.tsx
<html lang="fa-IR" dir="rtl" className={vazirmatn.variable}>
  <body>{children}</body>
</html>
```

- فونت: **وزیرمتن** از `next/font/google` با `subsets: ['arabic', 'latin']`.
- Tailwind: `direction: rtl` روی `html`؛ در `tailwind.config` خانواده فونت `var(--font-vazirmatn)`.
- shadcn/ui: در `components.json` مقدار `"rtl": true` تنظیم شده.
- تقویم جلالی: کامپوننت `JalaliDatePicker` از `@yuma/ui`.
- اعداد فارسی: از `toPersianDigits`/`formatCurrency` استفاده کنید، **نه** `toLocaleString('fa-IR')` — خروجی آن قابل اتکا و یکدست نیست.

## موبایل (React Native)

```ts
// app/_layout.tsx
import { enableRTL } from '@yuma/ui/native';
enableRTL(); // I18nManager.forceRTL(true)
```

- `I18nManager.forceRTL(true)` فقط پس از **ري‌استارت اپ** اثر می‌کند. `expo.extra.forcesRTL` در `app.json` این کار را از اولین اجرا انجام می‌دهد.
- فونت وزیرمتن با `useFonts` از `@expo-google-fonts/vazirmatn` بارگذاری می‌شود (`Vazirmatn_400Regular`, `Vazirmatn_700Bold`).
- NativeWind در `babel.config.js` با `jsxImportSource: 'nativewind'` و در `metro.config.js` با `withNativeWind` فعال است.
- تقویم جلالی: `JalaliCalendar` از `@yuma/ui/native`.
- **SafeArea:** از `SafeAreaProvider` و `useSafeAreaInsets` استفاده کنید تا محتوا زیر notch یا نوار پایین نرود. `contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}` الگوی پیشنهادی است.
- چیدمان: از `flex-row` بدون معکوس‌سازی دستی استفاده کنید؛ RN خودش در حالت RTL آینه می‌کند.

## سرور (NestJS)

- `process.env.TZ = 'Asia/Tehran'` در ابتدای `main.ts`.
- لوکال `fa-IR` و واحد پول `IRT` از `@yuma/config`.
- خطاها همیشه `{ ok: false, message, errors, path, timestamp }` با متن فارسی.
- اعتبارسنجی DTO با `class-validator` و پیام فارسی (نگاشت در `common/persian-validation.ts`).
- برای نام‌گذاری فیلدهای API از `camelCase` و برای جدول‌های دیتابیس از `snake_case` استفاده کنید.

## خطاهای رایج و راه‌حل

| اشتباه | درست |
| --- | --- |
| `toLocaleString('fa-IR')` | `formatCurrency` / `toPersianDigits` |
| کاما `,` به‌عنوان جداکننده هزارگان | `٬` (U+066C) |
| ذخیره مبلغ اعشاری | عدد صحیح به ریال |
| ذخیره تاریخ شمسی در دیتابیس | ذخیره ISO میلادی، تبدیل در نمایش |
| `new Date('1405/07/08')` | `parseJalaliDateString('1405/07/08')` |
| فرض «سه‌شنبه» برای ۸ مهر ۱۴۰۵ | درست: **چهارشنبه** |
| آینه‌کردن دستی `flex-row` در RN | واگذاری به RTL خود React Native |
