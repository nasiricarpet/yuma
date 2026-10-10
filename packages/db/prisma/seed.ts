import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * برخلاف Prisma CLI، زمانی که اسکریپت seed مستقیماً با `tsx` اجرا می‌شود
 * هیچ فایل `.env`ای به‌صورت خودکار در پروسه بارگذاری نمی‌شود و کلاینتِ تولیدشده
 * `DATABASE_URL` را در زمان اجرا از `process.env` می‌خواند. پس باید خودمان آن را
 * بخوانیم؛ در غیر این صورت seed با خطای «Environment variable not found» شکست می‌خورد.
 *
 * اولویت: متغیرهایی که از قبل در محیط تنظیم شده‌اند (مثلاً export شده در shell)
 * دست‌نخورده باقی می‌مانند.
 */
function loadDotenv(...candidates: string[]): void {
  if (process.env.DATABASE_URL) return;

  for (const file of candidates) {
    let content: string;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue; // فایل وجود ندارد — کاندید بعدی
    }

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;

      const key = trimmed.slice(0, eq).trim();
      const value = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, '');

      if (!(key in process.env)) process.env[key] = value;
    }

    if (process.env.DATABASE_URL) break;
  }
}

// packages/db/.env (در صورت وجود) و سپس .env ریشه‌ی monorepo
loadDotenv(
  resolve(__dirname, '../.env'),
  resolve(__dirname, '../../../.env'),
);

const prisma = new PrismaClient();

/**
 * هش bcrypt یکسان برای تمام کاربران دمو — متن اصلی: «admin1234»
 *
 * این فقط برای داده‌های تستی است؛ در محیط واقعی پسوردها هش نمی‌شوند.
 */
const DEMO_PASSWORD_HASH =
  '$2b$10$CwTycUXWue0Thq9StjUM0uJ8DoQZ0oQG3YQJNHvVvJzVvCz3XWJHa';

async function main() {
  console.log('🌱 Seeding...');

  // ۱) ادمین سیستم — وجود و نقش admin تضمین می‌شود
  const admin = await prisma.user.upsert({
    where: { mobile: '09120000000' },
    // update خالی نیست: اگر ردیف از قبل با نقش دیگری وجود داشت، admin می‌شود
    update: { role: 'admin' },
    create: {
      mobile: '09120000000',
      fullName: 'مدیر سیستم',
      passwordHash: DEMO_PASSWORD_HASH,
      role: 'admin',
    },
  });

  // ۲) مدیر قالیشویی
  const managerUser = await prisma.user.upsert({
    where: { mobile: '09120000001' },
    update: {},
    create: {
      mobile: '09120000001',
      fullName: 'مدیر قالیشویی نمونه',
      passwordHash: DEMO_PASSWORD_HASH,
      role: 'laundry_manager',
    },
  });

  // ۳) قالیشویی + سرویس‌ها
  const laundry = await prisma.laundry.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'قالیشویی نمونه تبریز',
      ownerId: managerUser.id,
      city: 'تبریز',
      address: 'تبریز، خیابان نمونه، پلاک ۱',
      phone: '04133333333',
    },
  });

  await prisma.laundryService.createMany({
    data: [
      { laundryId: laundry.id, name: 'شستشوی فرش دستباف', unitPrice: 350_000, unit: 'sqm' },
      { laundryId: laundry.id, name: 'شستشوی فرش ماشینی', unitPrice: 120_000, unit: 'sqm' },
      { laundryId: laundry.id, name: 'لکه‌گیری', unitPrice: 500_000, unit: 'count' },
    ],
    skipDuplicates: true,
  });

  // ۴) مشتری + آدرس پیش‌فرض
  const customer = await prisma.user.upsert({
    where: { mobile: '09120000002' },
    update: {},
    create: {
      mobile: '09120000002',
      fullName: 'مشتری نمونه',
      passwordHash: DEMO_PASSWORD_HASH,
      role: 'customer',
    },
  });

  await prisma.userAddress.upsert({
    where: { id: '00000000-0000-4000-8000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000010',
      userId: customer.id,
      title: 'خانه',
      province: 'آذربایجان شرقی',
      city: 'تبریز',
      fullAddress: 'تبریز، خیابان ولیعصر، کوچه گلستان، پلاک ۱۲، واحد ۳',
      postalCode: '5133899999',
      isDefault: true,
    },
  });

  // ۵) سفیر فعال
  const driverUser = await prisma.user.upsert({
    where: { mobile: '09120000003' },
    update: {},
    create: {
      mobile: '09120000003',
      fullName: 'سفیر نمونه',
      passwordHash: DEMO_PASSWORD_HASH,
      role: 'driver',
    },
  });

  await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      vehicleType: 'motorcycle',
      isActive: true,
    },
  });

  // ۶) قالب‌های پیامک فارسی — مسیر سفارش و پرداخت
  // متغیرها داخل آکولاد در زمان ارسال جایگزین می‌شوند: {{trackingCode}}
  const NOTIFICATION_TEMPLATES: Array<{
    code: string;
    subject: string | null;
    body: string;
  }> = [
    {
      code: 'order_requested',
      subject: null,
      body: 'یوما | سفارش {{trackingCode}} ثبت شد ✅\nما به‌زودی آن را تحویل می‌گیریم. از ثبت سفارش شما سپاسگزاریم {{customerName}}.',
    },
    {
      code: 'order_picked_up',
      subject: null,
      body: 'یوما | سفارش {{trackingCode}} تحویل داده شد 📦\nقالی شما توسط سفیر ما جمع‌آوری و به کارگاه منتقل شد.',
    },
    {
      code: 'quotation_sent',
      subject: null,
      body: 'یوما | پیش‌فاکتور سفارش {{trackingCode}} آماده است 🧾\nلطفاً در اپلیکیشن برآورد قیمت را بررسی و تأیید کنید.',
    },
    {
      code: 'order_in_cleaning',
      subject: null,
      body: 'یوما | سفارش {{trackingCode}} در حال شستشو است 🫧\nقالی شما در کارگاه در حال پاک‌سازی است. پس از کنترل کیفیت، تحویل را هماهنگ می‌کنیم.',
    },
    {
      code: 'order_ready',
      subject: null,
      body: 'یوما | سفارش {{trackingCode}} آماده تحویل است ✨\nقالی شما تمیز و بسته‌بندی شده است؛ به‌زودی سفیر ما آن را برایتان می‌آورد.',
    },
    {
      code: 'order_delivered',
      subject: null,
      body: 'یوما | سفارش {{trackingCode}} تحویل شد 🎉\nامیدواریم از نتیجه راضی باشید. منتظر دیدن دوباره‌تان هستیم.',
    },
    {
      code: 'payment_success',
      subject: null,
      body: 'یوما | پرداخت سفارش {{trackingCode}} دریافت شد 💳\nمبلغ {{amount}} تومان با کد پیگیری {{referenceId}} تأیید شد. سفارش شما در حال پردازش است.',
    },
    {
      code: 'payment_failed',
      subject: null,
      body: 'یوما | پرداخت سفارش {{trackingCode}} ناموفق بود ⚠️\nمبلغ {{amount}} تومان دریافت نشد. دلیل: {{reason}}\nلطفاً دوباره تلاش کنید.',
    },
  ];

  for (const t of NOTIFICATION_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { code: t.code },
      update: { body: t.body, isActive: true },
      create: {
        code: t.code,
        channel: 'sms',
        locale: 'fa',
        version: 1,
        subject: t.subject,
        body: t.body,
        isActive: true,
      },
    });
  }

  // ۷) تنظیمات پیش‌فرض سیستم — upsert بر اساس کلید یکتا
  const DEFAULT_SETTINGS: Array<{
    key: string;
    value: string | number | boolean;
    isPublic: boolean;
  }> = [
    { key: 'brand.name', value: 'قالیشویی یوما', isPublic: true },
    { key: 'brand.primaryColor', value: '#4f46e5', isPublic: true },
    { key: 'contact.phone', value: '04133333333', isPublic: true },
    { key: 'contact.email', value: 'support@yuma.local', isPublic: true },
    { key: 'payment.commissionRate', value: 10, isPublic: false },
    { key: 'order.cancelWindowMinutes', value: 30, isPublic: false },
    { key: 'order.otpTTLSeconds', value: 120, isPublic: false },
    { key: 'order.minPrice', value: 150000, isPublic: false },
    { key: 'sms.enabled', value: true, isPublic: false },
    { key: 'features.mobile', value: true, isPublic: true },
  ];

  for (const s of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: {
        key: s.key,
        value: s.value,
        category: s.key.split('.')[0]!,
        isPublic: s.isPublic,
      },
    });
  }

  console.log(
    '✅ Seed کامل شد — ادمین: %s | مدیر: %s | مشتری: %s | سفیر: %s | تنظیمات: %d | قالب‌ها: %d',
    admin.mobile,
    managerUser.mobile,
    customer.mobile,
    driverUser.mobile,
    DEFAULT_SETTINGS.length,
    NOTIFICATION_TEMPLATES.length,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
