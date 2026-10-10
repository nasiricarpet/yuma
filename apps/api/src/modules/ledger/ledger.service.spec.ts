import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LedgerService, type PaymentWithOrder } from './ledger.service';
import { SettlementsService } from './settlements.service';

/**
 * Prisma جعلی — فقط متدهایی که سرویس‌ها فراخوانی می‌کنند پیاده‌سازی شده‌اند.
 * `ledgerEntry` و `workshopSettlement` روی Mapهای درون‌حافظه‌ای نگه داشته می‌شوند
 * تا بتوان تراکنش‌ها و upsertها را به‌صورت واقعی شبیه‌سازی کرد.
 */
function createPrismaMock() {
  const entries = new Map<string, any>();
  const settlements = new Map<string, any>();
  /** اندیس ثانویه بر اساس id — findUnique با id جستجو می‌کند */
  const settlementsById = new Map<string, any>();
  let entrySeq = 0n;
  /** زمان ثبت قلم‌ها — درون دوره‌ی تست (سپتامبر ۲۰۲۶) */
  const now = new Date('2026-09-15T10:00:00Z');
  /** نگاشت سفارش → کارگاه — شبیه‌سازی join جدول orders */
  const orderLaundry = new Map<string, string>([
    ['order-1', 'laundry-1'],
    ['order-2', 'laundry-1'],
  ]);

  const ledgerEntry = {
    count: jest.fn(async ({ where }: any = {}) => {
      let items = [...entries.values()];
      if (where?.paymentId) items = items.filter((e) => e.paymentId === where.paymentId);
      return items.length;
    }),
    create: jest.fn(async ({ data }: any) => {
      const id = String(++entrySeq);
      const row = {
        id,
        createdAt: now,
        _laundryId: orderLaundry.get(data.orderId) ?? null,
        ...data,
      };
      entries.set(id, row);
      return row;
    }),
    findMany: jest.fn(async ({ where, select }: any = {}) => {
      let items = [...entries.values()];
      if (where?.createdAt) {
        if (where.createdAt.gte)
          items = items.filter((e) => e.createdAt >= where.createdAt.gte);
        if (where.createdAt.lt)
          items = items.filter((e) => e.createdAt < where.createdAt.lt);
      }
      // شبیه‌سازی join روی order.laundryId
      if (where?.order?.laundryId)
        items = items.filter((e) => e._laundryId === where.order.laundryId);
      if (select) {
        return items.map((item) =>
          Object.fromEntries(Object.entries(select).map(([key]) => [key, item[key]])),
        );
      }
      return items;
    }),
    groupBy: jest.fn(async ({ by, where, _sum }: any = {}) => {
      let items = [...entries.values()];
      if (where?.account) items = items.filter((e) => e.account === where.account);
      const grouped = by.map((dir: string) => {
        const matched = items.filter((e) => e.direction === dir);
        return {
          direction: dir,
          _sum: { amountMinor: matched.reduce((s, e) => s + e.amountMinor, 0n) },
        };
      });
      return grouped;
    }),
  };

  const workshopSettlement = {
    upsert: jest.fn(async ({ where, create, update }: any) => {
      const key = `${where.workshopId_periodStart_periodEnd.workshopId}|${where.workshopId_periodStart_periodEnd.periodStart.toISOString()}`;
      const existing = settlements.get(key);
      if (existing) {
        const merged = { ...existing, ...update };
        settlements.set(key, merged);
        settlementsById.set(merged.id, merged);
        return merged;
      }
      const created = { id: `settlement-${settlements.size + 1}`, ...create };
      settlements.set(key, created);
      settlementsById.set(created.id, created);
      return created;
    }),
    findUnique: jest.fn(async ({ where, select }: any) => {
      const row = settlementsById.get(where.id) ?? null;
      if (!row) return null;
      if (select) {
        return Object.fromEntries(Object.entries(select).map(([key]) => [key, row[key]]));
      }
      return row;
    }),
    update: jest.fn(async ({ where, data, select }: any) => {
      const row = settlementsById.get(where.id);
      const merged = { ...row, ...data };
      settlementsById.set(where.id, merged);
      if (select) {
        return Object.fromEntries(Object.entries(select).map(([key]) => [key, merged[key]]));
      }
      return merged;
    }),
    findMany: jest.fn(async () => [...settlements.values()]),
    count: jest.fn(async () => settlements.size),
  };

  const payment = {
    findUnique: jest.fn(async ({ where }: any) => {
      const entry = [...entries.values()].find((e) => e.paymentId === where.id);
      if (!entry) return null;
      return {
        id: where.id,
        orderId: entry.orderId,
        referenceId: entry.reference,
        amount: Number(entry._amount),
        order: { laundryId: entry._laundryId ?? null },
      };
    }),
  };

  return {
    ledgerEntry,
    workshopSettlement,
    payment,
    $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
    _entries: entries,
    _settlements: settlementsById,
    _orderLaundry: orderLaundry,
  };
}

/** ساخت یک پرداخت موفق نمونه — ۱٬۰۰۰٬۰۰۰ ریال */
function makePayment(overrides: Partial<PaymentWithOrder> = {}): PaymentWithOrder {
  return {
    id: 'payment-1',
    orderId: 'order-1',
    customerId: 'customer-1',
    amount: 1_000_000,
    authority: 'AUTH-1',
    referenceId: 'REF-123',
    status: 'success',
    method: 'online',
    createdAt: new Date('2026-09-15T10:00:00Z'),
    order: { laundryId: 'laundry-1' },
    ...overrides,
  };
}

describe('LedgerService', () => {
  let ledger: LedgerService;
  let settlements: SettlementsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    ledger = new LedgerService(prisma as never);
    settlements = new SettlementsService(prisma as never, { log: jest.fn() } as never);
  });

  // ۱) پرداخت موفق → ۳ قلم دفتر کل با تراز بدهکار/بستانکار
  it('پرداخت موفق را در سه قلم دوطرفه ثبت می‌کند و تراز برابر است', async () => {
    const count = await ledger.record(makePayment());

    expect(count).toBe(3);
    expect(prisma._entries.size).toBe(3);

    const rows = [...prisma._entries.values()];
    const debit = rows
      .filter((r) => r.direction === 'debit')
      .reduce((s, r) => s + r.amountMinor, 0n);
    const credit = rows
      .filter((r) => r.direction === 'credit')
      .reduce((s, r) => s + r.amountMinor, 0n);

    // تراز دوطرفه: مجموع بدهکار == مجموع بستانکار
    expect(debit).toBe(1_000_000n);
    expect(credit).toBe(1_000_000n);

    // حساب‌های درست در جهت درست
    const accounts = new Map(rows.map((r) => [r.account + ':' + r.direction, r.amountMinor]));
    expect(accounts.get('gateway_clearing:debit')).toBe(1_000_000n);
    expect(accounts.get('platform_revenue:credit')).toBe(100_000n);
    expect(accounts.get('workshop_payable:credit')).toBe(900_000n);

    // همه‌ی قلم‌ها یک گروه مشترک دارند
    expect(new Set(rows.map((r) => r.entryGroup)).size).toBe(1);
  });

  // ۲) ثبت مجدد همان پرداخت → قلم جدید ساخته نمی‌شود (idempotency)
  it('ثبت مجدد همان پرداخت قلم تکراری نمی‌سازد', async () => {
    await ledger.record(makePayment());
    const second = await ledger.record(makePayment());

    expect(second).toBe(0);
    expect(prisma._entries.size).toBe(3);
  });

  // ۳) محاسبه‌ی کارمزد — ۱۰٪ گردشده به نزدیک‌ترین ریال
  it('کارمزد پلتفرم را به‌صورت ۱۰ درصد گردشده محاسبه می‌کند', async () => {
    expect(ledger.calculateCommission(1_000_000)).toBe(100_000n);
    expect(ledger.calculateCommission(995_000)).toBe(99_500n);
    // گردشده به نزدیک‌ترین ریال
    expect(ledger.calculateCommission(15)).toBe(2n);
  });

  // ۴) محاسبه‌ی تسویه‌ی ماهانه — gross/commission/net درست
  it('تسویه‌ی ماهانه را از قلم‌های کارگاه محاسبه و ذخیره می‌کند', async () => {
    await ledger.record(makePayment());
    await ledger.record(
      makePayment({ id: 'payment-2', orderId: 'order-2', amount: 500_000 }),
    );

    const calc = await settlements.calculateMonthly('laundry-1', '2026-09');

    expect(calc.workshopId).toBe('laundry-1');
    expect(calc.grossMinor).toBe(1_500_000n);
    expect(calc.commissionMinor).toBe(150_000n);
    expect(calc.netPayableMinor).toBe(1_350_000n);
    // بازه‌ی انحصاری — کل سپتامبر
    expect(calc.periodStart).toEqual(new Date(Date.UTC(2026, 8, 1)));
    expect(calc.periodEnd).toEqual(new Date(Date.UTC(2026, 9, 1)));

    // ردیف تسویه هم ذخیره شده و pending است
    expect(prisma._settlements.size).toBe(1);
    const stored = [...prisma._settlements.values()][0];
    expect(stored.status).toBe('pending');
    expect(stored.netPayableMinor).toBe(1_350_000n);
  });

  // ۵) علامت‌گذاری تسویه به‌عنوان پرداخت‌شده — وضعیت و تاریخ و مرجع
  it('تسویه‌ی pending را به paid تبدیل و مرجع را ذخیره می‌کند', async () => {
    await ledger.record(makePayment());
    const calc = await settlements.calculateMonthly('laundry-1', '2026-09');
    const stored = [...prisma._settlements.values()][0];

    const result = await settlements.markPaid(
      stored.id,
      'TRANSFER-99',
      'admin-1',
    );

    expect(result.status).toBe('paid');
    const updated = prisma._settlements.get(stored.id);
    expect(updated.status).toBe('paid');
    expect(updated.reference).toBe('TRANSFER-99');
    expect(updated.paidAt).toBeInstanceOf(Date);
    expect(calc.netPayableMinor).toBe(900_000n);
  });

  // ۶) تسویه‌ی ناموجود → ۴۰۴، تسویه‌ی پرداخت‌شده → ۴۰۰
  it('برای تسویه‌ی ناموجود ۴۰۴ و برای تسویه‌ی پرداخت‌شده ۴۰۰ پرتاب می‌کند', async () => {
    await expect(settlements.markPaid('missing')).rejects.toThrow(NotFoundException);

    await ledger.record(makePayment());
    await settlements.calculateMonthly('laundry-1', '2026-09');
    const stored = [...prisma._settlements.values()][0];
    await settlements.markPaid(stored.id);

    await expect(settlements.markPaid(stored.id)).rejects.toThrow(BadRequestException);
  });
});
