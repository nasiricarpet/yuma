import { NotFoundException } from '@nestjs/common';
import { SettingsService } from './settings.service';

/**
 * Prisma جعلی — فقط متدهایی که سرویس فراخوانی می‌کند پیاده‌سازی شده‌اند.
 */
function createPrismaMock() {
  const settings = new Map<string, any>();

  const setting = {
    findMany: jest.fn(async ({ where, take, orderBy }: any = {}) => {
      let items = [...settings.values()];
      if (where?.category) items = items.filter((s) => s.category === where.category);
      if (where?.isPublic !== undefined)
        items = items.filter((s) => s.isPublic === where.isPublic);
      if (orderBy?.key === 'asc') items.sort((a, b) => a.key.localeCompare(b.key));
      return typeof take === 'number' ? items.slice(0, take) : items;
    }),
    count: jest.fn(async ({ where }: any = {}) => {
      let items = [...settings.values()];
      if (where?.category) items = items.filter((s) => s.category === where.category);
      if (where?.isPublic !== undefined)
        items = items.filter((s) => s.isPublic === where.isPublic);
      return items.length;
    }),
    upsert: jest.fn(async ({ where, create, update }: any) => {
      const existing = settings.get(where.key);
      if (existing) {
        const updated = {
          ...existing,
          ...update,
          value: update.value ?? existing.value,
          updatedAt: new Date(),
        };
        settings.set(where.key, updated);
        return updated;
      }
      const created = { id: `setting-${settings.size + 1}`, updatedAt: new Date(), ...create };
      settings.set(where.key, created);
      return created;
    }),
    findUnique: jest.fn(async ({ where }: any) => settings.get(where.key) ?? null),
  };

  return { setting, _settings: settings };
}

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new SettingsService(prisma as never);
  });

  it('یک تنظیم جدید را می‌سازد و تنظیم موجود را بروزرسانی می‌کند', async () => {
    // ساخت تنظیم جدید
    const created = await service.update('order.minPrice', 200000, 'admin-1');
    expect(created.key).toBe('order.minPrice');
    expect(created.value).toBe(200000);
    // دسته از بخش اول کلید گرفته می‌شود
    expect(created.category).toBe('order');
    expect(created.updatedById).toBe('admin-1');
    expect(prisma._settings.size).toBe(1);

    // بروزرسانی همان تنظیم — نباید رکورد جدید ساخته شود
    const updated = await service.update('order.minPrice', 250000, 'admin-2');
    expect(updated.value).toBe(250000);
    expect(updated.updatedById).toBe('admin-2');
    expect(prisma._settings.size).toBe(1);

    // isPublic هم قابل تغییر است
    const madePublic = await service.update('order.minPrice', 250000, 'admin-2', true);
    expect(madePublic.isPublic).toBe(true);
    expect(prisma._settings.size).toBe(1);
  });

  it('تنظیمات عمومی را به صورت کلید→مقدار برمی‌گرداند', async () => {
    await service.update('brand.name', 'قالیشویی یوما', 'admin-1', true);
    await service.update('brand.primaryColor', '#4f46e5', 'admin-1', true);
    await service.update('payment.commissionRate', 10, 'admin-1');

    const publicSettings = await service.getPublic();

    // فقط تنظیمات عمومی — commissionRate نیست
    expect(publicSettings['brand.name']).toBe('قالیشویی یوما');
    expect(publicSettings['brand.primaryColor']).toBe('#4f46e5');
    expect(publicSettings['payment.commissionRate']).toBeUndefined();
  });

  it('برای کلید ناموجود، استثنای ۴۰۴ پرتاب می‌کند', async () => {
    await expect(service.getValue('nonexistent.key')).rejects.toThrow(
      NotFoundException,
    );
  });
});
