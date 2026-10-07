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

  // ۱) ادمین سیستم
  const admin = await prisma.user.upsert({
    where: { mobile: '09120000000' },
    update: {},
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

  console.log(
    '✅ Seed کامل شد — ادمین: %s | مدیر: %s | مشتری: %s | سفیر: %s',
    admin.mobile,
    managerUser.mobile,
    customer.mobile,
    driverUser.mobile,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
