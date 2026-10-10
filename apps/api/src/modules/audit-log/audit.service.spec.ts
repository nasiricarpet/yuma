import { Prisma } from '@yuma/db';
import type { Request } from 'express';
import { AuditService } from './audit.service';

/**
 * شبیه‌سازی نگاشت دیتابیس: `Prisma.JsonNull` در ستون JSON قابل‌نول
 * به SQL NULL تبدیل می‌شود و خواندن مجدد آن `null` برمی‌گرداند.
 */
function dbValue(value: unknown): unknown {
  // `Prisma.JsonNull` یک مقدار تکی (singleton) است — مقایسه‌ی ارجاعی کافی است
  return Object.is(value, Prisma.JsonNull) ? null : value;
}

/**
 * Prisma جعلی — فقط متدهایی که سرویس فراخوانی می‌کند پیاده‌سازی شده‌اند.
 */
function createPrismaMock() {
  const logs = new Map<string, any>();
  let seq = 0;

  /** اعمال فیلترهای WhereInput روی کل داده‌ی ذخیره‌شده */
  function applyWhere(where: any = {}): any[] {
    let items = [...logs.values()];

    if (where.actorId) items = items.filter((l) => l.actorId === where.actorId);
    if (where.action) items = items.filter((l) => l.action === where.action);
    if (where.entityType)
      items = items.filter((l) => l.entityType === where.entityType);
    if (where.entityId)
      items = items.filter((l) => l.entityId === where.entityId);

    const createdAt = where.createdAt as
      | { gte?: Date; lte?: Date }
      | undefined;
    if (createdAt) {
      if (createdAt.gte)
        items = items.filter((l) => l.createdAt.valueOf() >= createdAt.gte!.valueOf());
      if (createdAt.lte)
        items = items.filter((l) => l.createdAt.valueOf() <= createdAt.lte!.valueOf());
    }

    return items;
  }

  const auditLog = {
    create: jest.fn(async ({ data }: { data: any }) => {
      const id = `audit-${++seq}`;
      const record = {
        id,
        createdAt: new Date(),
        ...data,
        before: dbValue(data.before),
        after: dbValue(data.after),
      };
      logs.set(id, record);
      return record;
    }),
    findMany: jest.fn(async ({ where, skip, take, orderBy }: any = {}) => {
      const items = applyWhere(where);
      if (orderBy?.createdAt === 'desc')
        items.sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf());
      const start = typeof skip === 'number' ? skip : 0;
      const end = typeof take === 'number' ? start + take : undefined;
      return items.slice(start, end);
    }),
    count: jest.fn(async ({ where }: any = {}) => applyWhere(where).length),
    groupBy: jest.fn(async ({ by, where }: any = {}) => {
      const items = applyWhere(where);
      const key = by[0] as 'action' | 'entityType';
      const counts = new Map<string, number>();
      for (const item of items) {
        counts.set(item[key], (counts.get(item[key]) ?? 0) + 1);
      }
      return [...counts.entries()].map(([k, count]) => ({ [key]: k, _count: { _all: count } }));
    }),
  };

  return { auditLog, _logs: logs };
}

describe('AuditService', () => {
  let service: AuditService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AuditService(prisma as never);
  });

  it('log() یک ردیف کامل می‌سازد', async () => {
    await service.log(
      'update',
      'user',
      'user-1',
      { role: 'customer' },
      { role: 'driver' },
      { actorId: 'admin-1', actorRole: 'admin', ip: '127.0.0.1', userAgent: 'curl' },
    );

    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);

    const stored = [...prisma._logs.values()][0];
    expect(stored.actorId).toBe('admin-1');
    expect(stored.actorRole).toBe('admin');
    expect(stored.action).toBe('update');
    expect(stored.entityType).toBe('user');
    expect(stored.entityId).toBe('user-1');
    expect(stored.before).toEqual({ role: 'customer' });
    expect(stored.after).toEqual({ role: 'driver' });
    expect(stored.ip).toBe('127.0.0.1');
    expect(stored.userAgent).toBe('curl');
    // requestId ارسال نشده — NULL ذخیره می‌شود
    expect(stored.requestId).toBeNull();
  });

  it('logFromRequest، IP و User-Agent و requestId را از درخواست استخراج می‌کند', async () => {
    const req = {
      ip: '10.0.0.7',
      headers: {
        'user-agent': 'Mozilla/5.0 (Admin Panel)',
        'x-request-id': 'req-abc-123',
      },
      user: { id: 'admin-2', mobile: '09120000000', role: 'admin' },
    } as unknown as Request;

    await service.logFromRequest(req, 'login', { type: 'user', id: 'admin-2' });

    const stored = [...prisma._logs.values()][0];
    expect(stored.actorId).toBe('admin-2');
    expect(stored.actorRole).toBe('admin');
    expect(stored.action).toBe('login');
    expect(stored.ip).toBe('10.0.0.7');
    expect(stored.userAgent).toBe('Mozilla/5.0 (Admin Panel)');
    expect(stored.requestId).toBe('req-abc-123');
  });

  it('فیلترهای actor/action/entityType و بازه‌ی زمانی کار می‌کنند', async () => {
    const base = new Date('2026-10-09T10:00:00Z');

    await service.log('create', 'order', 'order-1', undefined, { total: 1000 }, {
      actorId: 'admin-1',
      actorRole: 'admin',
    });
    await service.log('update', 'order', 'order-2', { status: 'pending' }, { status: 'ready' }, {
      actorId: 'admin-2',
      actorRole: 'manager',
    });
    await service.log('delete', 'user', 'user-9', { isActive: true }, undefined, {
      actorId: 'admin-1',
      actorRole: 'admin',
    });
    await service.log('login', 'user', 'admin-1', undefined, undefined, {
      actorId: 'admin-1',
      actorRole: 'admin',
    });

    // زمان دقیق هر رویداد را مستقیماً روی رکورد ذخیره‌شده تنظیم می‌کنیم
    let offset = 0;
    for (const record of [...prisma._logs.values()]) {
      record.createdAt = new Date(base.valueOf() + offset++ * 10 * 60_000);
    }

    // فیلتر actor
    const byActor = await service.list({ actorId: 'admin-1' });
    expect(byActor.total).toBe(3);
    expect(byActor.items.every((l: any) => l.actorId === 'admin-1')).toBe(true);

    // فیلتر action
    const byAction = await service.list({ action: 'delete' });
    expect(byAction.total).toBe(1);
    expect(byAction.items[0].entityId).toBe('user-9');

    // فیلتر entityType
    const byEntityType = await service.list({ entityType: 'order' });
    expect(byEntityType.total).toBe(2);

    // بازه‌ی زمانی — فقط دو رویداد اول
    const ranged = await service.list({
      from: new Date(base.valueOf() + 15 * 60_000),
      to: new Date(base.valueOf() + 35 * 60_000),
    });
    expect(ranged.total).toBe(2);
  });

  it('صفحه‌بندی درست است — page/limit/totalPages/ترتیب نزولی', async () => {
    // ۵ رویداد با فاصله‌ی زمانی
    for (let i = 0; i < 5; i++) {
      await service.log('update', 'order', `order-${i}`, undefined, undefined, {
        actorId: 'admin-1',
        actorRole: 'admin',
      });
      // تاخیر کوچک برای تفکیک ترتیب زمانی
      await new Promise((r) => setTimeout(r, 6));
    }

    // صفحه‌ی اول با اندازه‌ی ۲
    const page1 = await service.list({ page: 1, limit: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.totalPages).toBe(3);
    expect(page1.page).toBe(1);
    expect(page1.limit).toBe(2);
    // جدیدترین اول
    expect(page1.items[0].entityId).toBe('order-4');

    // صفحه‌ی دوم
    const page2 = await service.list({ page: 2, limit: 2 });
    expect(page2.items).toHaveLength(2);
    expect(page2.items[0].entityId).toBe('order-2');

    // صفحه‌ی آخر — یک آیتم باقی‌مانده
    const page3 = await service.list({ page: 3, limit: 2 });
    expect(page3.items).toHaveLength(1);
    expect(page3.items[0].entityId).toBe('order-0');

    // page بزرگ‌تر از تعداد صفحات → لیست خالی
    const pageBeyond = await service.list({ page: 9, limit: 2 });
    expect(pageBeyond.items).toHaveLength(0);
    expect(pageBeyond.total).toBe(5);
  });
});
