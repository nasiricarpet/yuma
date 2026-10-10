import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { OrderStateMachine } from './state-machine/order-state-machine';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { CreateOrderDto } from './dto/create-order.dto';

const CUSTOMER: AuthUser = { id: 'user-1', mobile: '09120000001', role: 'customer' };
const OTHER_CUSTOMER: AuthUser = {
  id: 'user-2',
  mobile: '09120000002',
  role: 'customer',
};
const LAUNDRY_USER: AuthUser = {
  id: 'user-3',
  mobile: '09120000003',
  role: 'laundry_manager',
};
const DRIVER: AuthUser = { id: 'user-4', mobile: '09120000004', role: 'driver' };
const ADMIN: AuthUser = { id: 'user-5', mobile: '09120000005', role: 'admin' };

/** کاربر لاگین‌شده نقش کارگاه برای تست‌های override ادمین */
function asAdmin(user: AuthUser): AuthUser {
  return { ...user, role: 'admin', id: 'user-5' };
}

/**
 * Prisma جعلی — فقط متدهایی که OrdersService فراخوانی می‌کند پیاده‌سازی
 * شده‌اند. سفارش‌ها در یک Map نگه‌داری می‌شوند تا مالکیت، تاریخچه و
 * انتقال‌های وضعیت در تراکنش بر یک حالت مشترک اعمال شوند.
 */
function createPrismaMock() {
  const orders = new Map<string, Record<string, any>>();
  const history: Record<string, any>[] = [];
  const assignments: Record<string, any>[] = [];
  const services = new Map<string, Record<string, any>>();
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}-${++seq}`;

  /** فیلتر کردن سفارش‌ها بر اساس شرط WHERE سطح اول */  function filterOrders(where: Record<string, any> = {}): Record<string, any>[] {
    let rows = [...orders.values()];

    for (const [key, value] of Object.entries(where)) {
      if (key === 'OR') {
        rows = rows.filter((row) =>
          value.some((cond: any) =>
            Object.entries(cond).every(([k, v]) => matchField(row[k], v)),
          ),
        );
      } else if (key === 'createdAt' && typeof value === 'object') {
        if (value.gte) rows = rows.filter((row) => row.createdAt >= value.gte);
        if (value.lte) rows = rows.filter((row) => row.createdAt <= value.lte);
      } else {
        rows = rows.filter((row) => matchField(row[key], value));
      }
    }

    return rows;
  }

  /** تطبیق یک فیلد با مقدار شرط — شیء‌های تودرتو (customer) هم پشتیبانی می‌شوند */
  function matchField(value: any, condition: any): boolean {
    if (condition === undefined) return true;
    if (typeof condition === 'object' && condition !== null && !Array.isArray(condition)) {
      if (condition.contains !== undefined) {
        return typeof value === 'string' && value.includes(condition.contains);
      }
      return Object.entries(condition).every(([k, v]) =>
        matchField(value?.[k], v),
      );
    }

    return value === condition;
  }

  /** روابط include روی یک رکورد اعمال می‌شوند */
  function withInclude(order: Record<string, any>, include?: Record<string, any>) {
    if (!include) return { ...order };

    return {
      ...order,
      items: order.items ?? [],
      media: order.media ?? [],
      laundry: order.laundryId
        ? { id: order.laundryId, name: 'کارگاه', city: 'تهران' }
        : null,
      driver: order.driverId
        ? { id: order.driverId, userId: 'driver-user' }
        : null,
      statusHistory: history.filter((row) => row.orderId === order.id),
      customer: order.customerId
        ? { id: order.customerId, fullName: 'مشتری', mobile: '09120000000' }
        : null,
    };
  }

  const order = {
    findUnique: jest.fn(async ({ where, select, include }: any) => {
      let row: Record<string, any> | undefined;

      if (where.id !== undefined) row = orders.get(where.id);
      else if (where.idempotencyKey !== undefined)
        row = [...orders.values()].find((o) => o.idempotencyKey === where.idempotencyKey);
      else if (where.trackingCode !== undefined)
        row = [...orders.values()].find((o) => o.trackingCode === where.trackingCode);

      if (!row) return null;
      if (include) return withInclude(row, include);

      const picked: Record<string, any> = {};
      for (const key of Object.keys(select ?? row)) picked[key] = row[key];

      return picked;
    }),
    findFirst: jest.fn(async ({ where, select, include }: any) => {
      const row = filterOrders(where)[0];
      if (!row) return null;
      if (include) return withInclude(row, include);

      const picked: Record<string, any> = {};
      for (const key of Object.keys(select ?? row)) picked[key] = row[key];

      return picked;
    }),
    findMany: jest.fn(async ({ where, include, skip = 0, take = 100 }: any) => {
      const rows = filterOrders(where)
        .sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf())
        .slice(skip, skip + take);

      return include ? rows.map((row) => withInclude(row, include)) : rows;
    }),
    count: jest.fn(async ({ where }: any = {}) => filterOrders(where).length),
    groupBy: jest.fn(async () => {
      const counts = new Map<string, number>();
      for (const row of orders.values()) {
        counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
      }

      return [...counts.entries()].map(([status, count]) => ({
        status,
        _count: { _all: count },
      }));
    }),
    create: jest.fn(async ({ data, include }: any) => {
      const id = nextId('order');
      const row: Record<string, any> = {
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'requested',
        currency: 'IRR',
        totalAmount: 0,
        ...data,
      };

      if (data.items?.create) {
        row.items = data.items.create.map((item: any, index: number) => ({
          id: `${id}-item-${index}`,
          orderId: id,
          ...item,
        }));
      }
      if (data.statusHistory?.create) {
        const entry = {
          id: `${id}-hist-0`,
          orderId: id,
          createdAt: new Date(),
          ...data.statusHistory.create,
        };
        history.push(entry);
        row.statusHistory = [entry];
      }
      if (data.quotation?.create) {
        row.quotation = { id: `${id}-quotation`, orderId: id, ...data.quotation.create };
      }

      orders.set(id, row);

      return withInclude(row, include);
    }),
    update: jest.fn(async ({ where, data, include }: any) => {
      const row = orders.get(where.id);
      if (!row) throw new Error('سفارش یافت نشد');

      Object.assign(row, data, { updatedAt: new Date() });

      return withInclude(row, include);
    }),
  };

  const orderStatusHistory = {
    create: jest.fn(async ({ data }: any) => {
      const entry = { id: nextId('hist'), createdAt: new Date(), ...data };
      history.push(entry);

      return entry;
    }),
    findMany: jest.fn(async ({ where, orderBy }: any) => {
      let rows = history.filter((row) => row.orderId === where.orderId);
      if (orderBy?.createdAt === 'asc')
        rows.sort((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf());
      if (orderBy?.createdAt === 'desc')
        rows.sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf());

      return rows;
    }),
  };

  const assignment = {
    findFirst: jest.fn(async ({ where }: any) =>
      assignments.find((row) => row.orderId === where.orderId && row.phase === where.phase) ?? null,
    ),
    create: jest.fn(async ({ data }: any) => {
      const entry = { id: nextId('assignment'), createdAt: new Date(), ...data };
      assignments.push(entry);

      return entry;
    }),
    update: jest.fn(async ({ where, data }: any) => {
      const entry = assignments.find((row) => row.id === where.id);
      if (!entry) throw new Error('وظیفه یافت نشد');
      Object.assign(entry, data, { updatedAt: new Date() });

      return entry;
    }),
  };

  const laundryService = {
    findMany: jest.fn(async ({ where }: any) =>
      where?.id?.in.map((id: string) => services.get(id)).filter(Boolean) ?? [],
    ),
  };

  const laundry = {
    findUnique: jest.fn(async ({ where }: any) =>
      where.id === 'laundry-1'
        ? { id: 'laundry-1', isActive: true }
        : null,
    ),
  };

  const driver = {
    findUnique: jest.fn(async ({ where }: any) =>
      where.id === 'driver-1' ? { id: 'driver-1', isActive: true } : null,
    ),
  };

  const tx = { order, orderStatusHistory, assignment };
  const prisma = {
    order,
    orderStatusHistory,
    assignment,
    laundryService,
    laundry,
    driver,
    $transaction: jest.fn(async (callback: any) => callback(tx)),
  };

  /** ثبت یک سفارش مستقیماً در مخزن — برای آماده‌سازی تست‌ها */
  function seedOrder(overrides: Record<string, any> = {}): Record<string, any> {
    const id = nextId('order');
    const row: Record<string, any> = {
      id,
      trackingCode: `YUMA-${id.toUpperCase()}`,
      idempotencyKey: `key-${id}`,
      customerId: CUSTOMER.id,
      laundryId: 'laundry-1',
      driverId: null,
      status: 'requested',
      currency: 'IRR',
      totalAmount: 100000,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
      ...overrides,
    };
    orders.set(id, row);

    return row;
  }

  return { prisma, seedOrder, orders, history, assignments, services, audit: createAuditMock() };
}

type PrismaMock = ReturnType<typeof createPrismaMock>;

/**
 * AuditService جعلی — `logFromRequest` را با همان امضای سرویس واقعی
 * شبیه‌سازی می‌کند تا رویدادهای ثبت‌شده در تست‌ها قابل بررسی باشند.
 */
function createAuditMock() {
  const calls: Array<{
    req: unknown;
    action: string;
    entity: { type: string; id?: string | null };
    before?: unknown;
    after?: unknown;
    context?: Record<string, unknown>;
  }> = [];

  return {
    calls,
    logFromRequest: jest.fn(async (req, action, entity, before, after, context) => {
      calls.push({ req, action, entity, before, after, context });
    }),
    log: jest.fn(async (action, entityType, entityId, before, after, context) => {
      calls.push({
        req: null,
        action,
        entity: { type: entityType, id: entityId },
        before,
        after,
        context,
      });
    }),
  };
}

/** آخرین رویداد ممیزی ثبت‌شده — برای بررسی لاگ رویدادها در تست‌ها */
function lastAuditEntry(mock: PrismaMock) {
  return mock.audit.calls[mock.audit.calls.length - 1];
}

/** درخواست HTTP جعلی با IP و User-Agent — برای تست استخراج اطلاعات درخواست */
function fakeRequest(overrides: Record<string, any> = {}): Request {
  return {
    ip: '85.10.20.30',
    headers: { 'user-agent': 'Jest/1.0 (test)' },
    ...overrides,
  } as unknown as Request;
}

/** آخرین رخداد تاریخچه — برای بررسی لاگ انتقال وضعیت در تست‌ها */
function lastHistoryEntry(mock: PrismaMock): Record<string, any> {
  return mock.history[mock.history.length - 1];
}

/**
 * شبیه‌سازی EventEmitter2 — رویدادهای انتشارشده را نگه می‌دارد تا
 * بشود بررسی کرد که تغییر وضعیت، رویداد اعلان را منتشر می‌کند.
 */
function createEventEmitter() {
  return {
    emitted: [] as Array<{ event: string; payload: unknown }>,
    emit(event: string, payload: unknown): boolean {
      this.emitted.push({ event, payload });
      return true;
    },
  };
}

/** ساخت سرویس با Prisma جعلی و ماشین وضعیت واقعی */
function createService(mock: PrismaMock) {
  const s3 = { uploadFile: jest.fn(async () => 'orders/x.jpg') };

  return new OrdersService(
    mock.prisma as any,
    s3 as any,
    new OrderStateMachine(),
    mock.audit as any,
    createEventEmitter() as any,
  );
}

/** DTO ثبت سفارش نمونه */
function createOrderDto(overrides: Partial<CreateOrderDto> = {}): CreateOrderDto {
  return {
    idempotencyKey: 'idem-1',
    pickupAddress: {
      province: 'تهران',
      city: 'تهران',
      postalCode: '1234567890',
      fullAddress: 'خیابان اصلی، پلاک ۱',
    },
    items: [{ serviceId: 'service-1', quantity: 2 }],
    ...overrides,
  };
}

describe('OrdersService — ثبت سفارش', () => {
  let mock: PrismaMock;
  let service: OrdersService;

  beforeEach(() => {
    mock = createPrismaMock();
    service = createService(mock);
    mock.services.set('service-1', {
      id: 'service-1',
      laundryId: 'laundry-1',
      unitPrice: 50000,
      isActive: true,
    });
  });

  it('سفارش را با وضعیت requested و کد پیگیری YUMA ثبت می‌کند', async () => {
    const order = await service.createOrder(CUSTOMER, createOrderDto());

    expect(order.status).toBe('requested');
    expect(order.trackingCode).toMatch(/^YUMA-/);
    expect(order.trackingCode.replace('YUMA-', '')).toHaveLength(6);
    expect(order.customerId).toBe(CUSTOMER.id);
    expect(order.items).toHaveLength(1);
  });

  it('جمع کل را از قیمت‌های سرور محاسبه می‌کند', async () => {
    const order = await service.createOrder(CUSTOMER, createOrderDto());

    expect(order.totalAmount).toBe(100000);
  });

  it('اولین رخداد تاریخچه را ثبت می‌کند', async () => {
    await service.createOrder(CUSTOMER, createOrderDto());

    expect(mock.history).toHaveLength(1);
    expect(mock.history[0].status).toBe('requested');
    expect(mock.history[0].actorRole).toBe('customer');
  });

  it('با idempotencyKey تکراری سفارش قبلی را برمی‌گرداند', async () => {
    const first = await service.createOrder(CUSTOMER, createOrderDto());
    const second = await service.createOrder(CUSTOMER, createOrderDto());

    expect(second.id).toBe(first.id);
    expect(mock.orders.size).toBe(1);
  });

  it('قلم ناموجود را رد می‌کند', async () => {
    await expect(
      service.createOrder(
        CUSTOMER,
        createOrderDto({ items: [{ serviceId: 'missing', quantity: 1 }] }),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('قلم غیرفعال را رد می‌کند', async () => {
    mock.services.set('service-2', {
      id: 'service-2',
      laundryId: 'laundry-1',
      unitPrice: 10000,
      isActive: false,
    });

    await expect(
      service.createOrder(
        CUSTOMER,
        createOrderDto({ items: [{ serviceId: 'service-2', quantity: 1 }] }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('قلم متعلق به کارگاه دیگر را رد می‌کند', async () => {
    mock.services.set('service-3', {
      id: 'service-3',
      laundryId: 'laundry-2',
      unitPrice: 10000,
      isActive: true,
    });

    await expect(
      service.createOrder(
        CUSTOMER,
        createOrderDto({
          laundryId: 'laundry-1',
          items: [{ serviceId: 'service-3', quantity: 1 }],
        }),
      ),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('OrdersService — دسترسی مشتری', () => {
  let mock: PrismaMock;
  let service: OrdersService;
  let orders: any[];

  beforeEach(() => {
    mock = createPrismaMock();
    service = createService(mock);
    mock.seedOrder({ customerId: CUSTOMER.id, status: 'requested' });
    mock.seedOrder({ customerId: OTHER_CUSTOMER.id, status: 'requested' });
  });

  it('فقط سفارش‌های خود مشتری را لیست می‌کند', async () => {
    orders = await service.getCustomerOrders(CUSTOMER.id);
    expect(orders).toHaveLength(1);
    expect(orders.every((o) => o.customerId === CUSTOMER.id)).toBe(true);
  });

  it('دسترسی به سفارش دیگران را با NotFound رد می‌کند', async () => {
    const other = [...mock.orders.values()].find(
      (o) => o.customerId === OTHER_CUSTOMER.id,
    );

    await expect(
      service.getCustomerOrder(CUSTOMER.id, other!.id),
    ).rejects.toThrow(NotFoundException);
  });

  it('تاریخچه را فقط برای صاحب سفارش برمی‌گرداند', async () => {
    const own = [...mock.orders.values()].find((o) => o.customerId === CUSTOMER.id)!;
    const other = [...mock.orders.values()].find(
      (o) => o.customerId === OTHER_CUSTOMER.id,
    )!;

    await expect(
      service.getOrderHistory(CUSTOMER.id, other.id),
    ).rejects.toThrow(NotFoundException);

    const history = await service.getOrderHistory(CUSTOMER.id, own.id);
    expect(Array.isArray(history)).toBe(true);
  });

  it('پیگیری عمومی با کد پیگیری کار می‌کند', async () => {
    const order = mock.seedOrder();
    const tracked = await service.trackByCode(order.trackingCode);

    expect(tracked.id).toBe(order.id);
    expect(tracked).not.toHaveProperty('customer.mobile');
  });

  it('کد پیگیری ناموجود را رد می‌کند', async () => {
    await expect(service.trackByCode('YUMA-NOPE')).rejects.toThrow(NotFoundException);
  });
});

describe('OrdersService — لغو سفارش', () => {
  let mock: PrismaMock;
  let service: OrdersService;

  beforeEach(() => {
    mock = createPrismaMock();
    service = createService(mock);
  });

  it('مشتری سفارش خودش را لغو می‌کند', async () => {
    const order = mock.seedOrder({ status: 'awaiting_pickup' });
    const cancelled = await service.cancelOrder(
      CUSTOMER,
      order.id,
      'از سفارش منصرف شدم',
    );

    expect(cancelled.status).toBe('cancelled');
    expect(mock.history.at(-1)).toMatchObject({
      orderId: order.id,
      status: 'cancelled',
      note: 'از سفارش منصرف شدم',
      actorRole: 'customer',
    });
  });

  it('لغو سفارش دیگری ممنوع است', async () => {
    const order = mock.seedOrder({ customerId: OTHER_CUSTOMER.id });

    await expect(
      service.cancelOrder(CUSTOMER, order.id, 'دلیل'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('لغو بعد از تحویل مجاز نیست', async () => {
    const order = mock.seedOrder({ status: 'delivered' });

    await expect(
      service.cancelOrder(CUSTOMER, order.id, 'دلیل'),
    ).rejects.toThrow(BadRequestException);
  });

  it('ادمین هر سفارش غیرپایانی را لغو می‌کند', async () => {
    const order = mock.seedOrder({
      customerId: OTHER_CUSTOMER.id,
      status: 'in_cleaning',
    });
    const cancelled = await service.cancelOrderAdmin(
      ADMIN,
      order.id,
      'درخواست مشتری',
    );

    expect(cancelled.status).toBe('cancelled');
    expect(lastHistoryEntry(mock).actorRole).toBe('admin');
  });

  it('ادمین نمی‌تواند سفارش تحویل‌شده را لغو کند', async () => {
    const order = mock.seedOrder({ status: 'delivered' });

    await expect(
      service.cancelOrderAdmin(ADMIN, order.id, 'دلیل'),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('OrdersService — نقش‌ها در تغییر وضعیت', () => {
  let mock: PrismaMock;
  let service: OrdersService;

  beforeEach(() => {
    mock = createPrismaMock();
    service = createService(mock);
  });

  it('کارگاه می‌تواند سفارش خودش را تأیید کند', async () => {
    const order = mock.seedOrder({ laundryId: 'laundry-1', status: 'requested' });
    const updated = await service.updateWorkshopOrderStatus(
      LAUNDRY_USER,
      'laundry-1',
      order.id,
      'awaiting_confirmation',
    );

    expect(updated.status).toBe('awaiting_confirmation');
    expect(lastHistoryEntry(mock).actorRole).toBe('laundry_manager');
  });

  it('کارگاه نمی‌تواند سفارش کارگاه دیگر را تغییر دهد', async () => {
    const order = mock.seedOrder({ laundryId: 'laundry-2', status: 'requested' });

    await expect(
      service.updateWorkshopOrderStatus(
        LAUNDRY_USER,
        'laundry-1',
        order.id,
        'awaiting_confirmation',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('کارگاه نمی‌تواند انتقال سفیر را انجام دهد', async () => {
    const order = mock.seedOrder({ laundryId: 'laundry-1', status: 'awaiting_pickup' });

    await expect(
      service.updateWorkshopOrderStatus(
        LAUNDRY_USER,
        'laundry-1',
        order.id,
        'picked_up',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('سفیر می‌تواند سفارش خودش را برداشت کند', async () => {
    const order = mock.seedOrder({ driverId: 'driver-1', status: 'awaiting_pickup' });
    const updated = await service.updateDriverOrderStatus(
      DRIVER,
      'driver-1',
      order.id,
      'picked_up',
    );

    expect(updated.status).toBe('picked_up');
  });

  it('سفیر نمی‌تواند سفارش سفیر دیگر را تغییر دهد', async () => {
    const order = mock.seedOrder({ driverId: 'driver-2', status: 'awaiting_pickup' });

    await expect(
      service.updateDriverOrderStatus(DRIVER, 'driver-1', order.id, 'picked_up'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('انتقال نامعتبر رد می‌شود', async () => {
    const order = mock.seedOrder({ laundryId: 'laundry-1', status: 'requested' });

    await expect(
      service.updateWorkshopOrderStatus(
        LAUNDRY_USER,
        'laundry-1',
        order.id,
        'delivered',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('برای انتقال‌های حساس دلیل اجباری است', async () => {
    const order = mock.seedOrder({
      laundryId: 'laundry-1',
      status: 'awaiting_assessment',
    });

    await expect(
      service.updateWorkshopOrderStatus(
        LAUNDRY_USER,
        'laundry-1',
        order.id,
        'quoted',
      ),
    ).rejects.toThrow(BadRequestException);

    const updated = await service.updateWorkshopOrderStatus(
      LAUNDRY_USER,
      'laundry-1',
      order.id,
      'quoted',
      'برآورد: ۲۰۰ هزار ریال',
    );

    expect(updated.status).toBe('quoted');
    expect(lastHistoryEntry(mock).note).toBe('برآورد: ۲۰۰ هزار ریال');
  });

  it('مشتری می‌تواند برآورد را تأیید کند', async () => {
    const order = mock.seedOrder({ status: 'quoted' });
    const updated = await service.adminUpdateOrderStatus(
      { ...CUSTOMER, role: 'customer' },
      order.id,
      'quote_approved',
    );

    expect(updated.status).toBe('quote_approved');
  });
});

describe('OrdersService — override ادمین', () => {
  let mock: PrismaMock;
  let service: OrdersService;

  beforeEach(() => {
    mock = createPrismaMock();
    service = createService(mock);
  });

  it('ادمین می‌تواند هر انتقال مجاز را انجام دهد', async () => {
    const order = mock.seedOrder({ status: 'awaiting_pickup' });
    const updated = await service.adminUpdateOrderStatus(
      ADMIN,
      order.id,
      'picked_up',
    );

    expect(updated.status).toBe('picked_up');
  });

  it('پرش مراحل توسط ادمین فقط با دلیل مجاز است', async () => {
    const order = mock.seedOrder({ status: 'requested' });

    await expect(
      service.adminUpdateOrderStatus(ADMIN, order.id, 'in_cleaning'),
    ).rejects.toThrow(BadRequestException);

    const updated = await service.adminUpdateOrderStatus(
      ADMIN,
      order.id,
      'in_cleaning',
      'تأیید تلفنی مشتری',
    );

    expect(updated.status).toBe('in_cleaning');
    expect(lastHistoryEntry(mock).note).toBe('تأیید تلفنی مشتری');
  });

  it('تغییر وضعیت سفارش لغوشده مجاز نیست', async () => {
    const order = mock.seedOrder({ status: 'cancelled' });

    await expect(
      service.adminUpdateOrderStatus(ADMIN, order.id, 'in_cleaning', 'دلیل'),
    ).rejects.toThrow(BadRequestException);
  });

  it('سفارش ناموجود رد می‌شود', async () => {
    await expect(
      service.adminUpdateOrderStatus(ADMIN, 'missing', 'picked_up'),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('OrdersService — تخصیص دستی', () => {
  let mock: PrismaMock;
  let service: OrdersService;

  beforeEach(() => {
    mock = createPrismaMock();
    service = createService(mock);
  });

  it('ادمین کارگاه را تخصیص می‌دهد', async () => {
    const order = mock.seedOrder({ laundryId: null });
    const updated = await service.assignWorkshop(
      ADMIN,
      order.id,
      'laundry-1',
      'تخصیص دستی',
    );

    expect(updated.laundryId).toBe('laundry-1');
    expect(lastHistoryEntry(mock).note).toBe('تخصیص دستی');
  });

  it('تخصیص کارگاه ناموجود رد می‌شود', async () => {
    const order = mock.seedOrder();

    await expect(
      service.assignWorkshop(ADMIN, order.id, 'missing'),
    ).rejects.toThrow(BadRequestException);
  });

  it('ادمین سفیر را تخصیص می‌دهد و وظیفه برداشت می‌سازد', async () => {
    const order = mock.seedOrder({ driverId: null });
    const updated = await service.assignDriver(ADMIN, order.id, 'driver-1');

    expect(updated.driverId).toBe('driver-1');
    expect(mock.assignments).toHaveLength(1);
    expect(mock.assignments[0]).toMatchObject({
      orderId: order.id,
      driverId: 'driver-1',
      phase: 'pickup',
      status: 'pending',
    });
  });

  it('تخصیص مجدد سفیر، وظیفه قبلی را آپدیت می‌کند', async () => {
    const order = mock.seedOrder({ driverId: 'driver-2' });
    mock.assignments.push({
      id: 'asg-1',
      orderId: order.id,
      driverId: 'driver-2',
      phase: 'pickup',
      status: 'accepted',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.assignDriver(ADMIN, order.id, 'driver-1');

    expect(mock.assignments).toHaveLength(1);
    expect(mock.assignments[0]).toMatchObject({
      driverId: 'driver-1',
      status: 'pending',
    });
  });

  it('تخصیص سفیر ناموجود رد می‌شود', async () => {
    const order = mock.seedOrder();

    await expect(
      service.assignDriver(ADMIN, order.id, 'missing'),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('OrdersService — لیست و آمار ادمین', () => {
  let mock: PrismaMock;
  let service: OrdersService;

  beforeEach(() => {
    mock = createPrismaMock();
    service = createService(mock);
    mock.seedOrder({ status: 'requested', laundryId: 'laundry-1' });
    mock.seedOrder({ status: 'in_cleaning', laundryId: 'laundry-2' });
    mock.seedOrder({
      status: 'delivered',
      laundryId: 'laundry-1',
      driverId: 'driver-1',
    });
  });

  it('همهٔ سفارش‌ها را برمی‌گرداند', async () => {
    const result = await service.listOrdersForAdmin({ page: 1, limit: 20 });

    expect(result.orders).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(1);
  });

  it('بر اساس وضعیت فیلتر می‌کند', async () => {
    const result = await service.listOrdersForAdmin({ status: 'delivered' });

    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].status).toBe('delivered');
  });

  it('بر اساس کارگاه فیلتر می‌کند', async () => {
    const result = await service.listOrdersForAdmin({ laundryId: 'laundry-1' });

    expect(result.orders).toHaveLength(2);
  });

  it('بر اساس سفیر فیلتر می‌کند', async () => {
    const result = await service.listOrdersForAdmin({ driverId: 'driver-1' });

    expect(result.orders).toHaveLength(1);
  });

  it('با جستجوی کد پیگیری فیلتر می‌کند', async () => {
    const target = [...mock.orders.values()].find((o) => o.status === 'delivered')!;
    const result = await service.listOrdersForAdmin({
      search: target.trackingCode.replace('YUMA-', ''),
    });

    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].id).toBe(target.id);
  });

  it('صفحه‌بندی را رعایت می‌کند', async () => {
    const page1 = await service.listOrdersForAdmin({ page: 1, limit: 2 });
    const page2 = await service.listOrdersForAdmin({ page: 2, limit: 2 });

    expect(page1.orders).toHaveLength(2);
    expect(page2.orders).toHaveLength(1);
    expect(page1.orders[0].id).not.toBe(page2.orders[0].id);
  });

  it('نتیجه بر اساس createdAt نزولی مرتب است', async () => {
    const { orders } = await service.listOrdersForAdmin({});
    const createdAt = orders.map((o) => o.createdAt.valueOf());

    expect([...createdAt].sort((a, b) => b - a)).toEqual(createdAt);
  });

  it('جزئیات کامل با روابط را برمی‌گرداند', async () => {
    const target = [...mock.orders.values()][0];
    const order = await service.getOrderForAdmin(target.id);

    expect(order.id).toBe(target.id);
    expect(order).toHaveProperty('statusHistory');
    expect(order).toHaveProperty('customer');
  });

  it('آمار تعداد هر وضعیت را برمی‌گرداند', async () => {
    const stats = await service.getOrderStats();

    expect(stats.total).toBe(3);
    expect(stats.byStatus.find((row) => row.status === 'requested')?.count).toBe(1);
    expect(stats.byStatus.find((row) => row.status === 'in_cleaning')?.count).toBe(1);
    expect(stats.byStatus.find((row) => row.status === 'delivered')?.count).toBe(1);
  });
});

describe('OrdersService — لیست ایزولهٔ کارگاه و سفیر', () => {
  let mock: PrismaMock;
  let service: OrdersService;

  beforeEach(() => {
    mock = createPrismaMock();
    service = createService(mock);
    mock.seedOrder({ laundryId: 'laundry-1', driverId: null });
    mock.seedOrder({ laundryId: 'laundry-2', driverId: 'driver-1' });
    mock.seedOrder({ laundryId: 'laundry-1', driverId: 'driver-2' });
  });

  it('کارگاه فقط سفارش‌های خودش را می‌بیند', async () => {
    const orders = await service.getWorkshopOrders('laundry-1');

    expect(orders).toHaveLength(2);
    expect(orders.every((o) => o.laundryId === 'laundry-1')).toBe(true);
  });

  it('سفیر فقط سفارش‌های خودش را می‌بیند', async () => {
    const orders = await service.getDriverOrders('driver-1');

    expect(orders).toHaveLength(1);
    expect(orders[0].driverId).toBe('driver-1');
  });

  it('لیست‌ها بر اساس createdAt نزولی مرتب هستند', async () => {
    const orders = await service.getWorkshopOrders('laundry-1');
    const createdAt = orders.map((o) => o.createdAt.valueOf());

    expect([...createdAt].sort((a, b) => b - a)).toEqual(createdAt);
  });
});

describe('OrdersService — رویدادهای ممیزی', () => {
  let mock: PrismaMock;
  let service: OrdersService;

  beforeEach(() => {
    mock = createPrismaMock();
    service = createService(mock);
    mock.services.set('service-1', {
      id: 'service-1',
      laundryId: 'laundry-1',
      unitPrice: 50000,
      isActive: true,
    });
  });

  it('ثبت سفارش یک رویداد ممیزی create می‌سازد', async () => {
    const order = await service.createOrder(
      CUSTOMER,
      createOrderDto(),
      fakeRequest(),
    );

    expect(mock.audit.logFromRequest).toHaveBeenCalledTimes(1);

    const entry = lastAuditEntry(mock);
    expect(entry.action).toBe('create');
    expect(entry.entity).toEqual({ type: 'order', id: order.id });
    // سفارش تازه ساخته شده — قبل از آن چیزی وجود ندارد
    expect(entry.before).toBeNull();
    // بعد: خود سفارش ثبت‌شده
    expect(entry.after).toMatchObject({ id: order.id, status: 'requested' });
    // بازیگر از actor سرویس استخراج شده است
    expect(entry.context).toEqual({
      actorId: CUSTOMER.id,
      actorRole: 'customer',
    });
  });

  it('تغییر وضعیت رویداد status-change با before/after می‌سازد', async () => {
    const order = mock.seedOrder({ status: 'requested' });

    await service.adminUpdateOrderStatus(
      ADMIN,
      order.id,
      'awaiting_confirmation',
      undefined,
      fakeRequest({ ip: '10.20.30.40' }),
    );

    const entry = lastAuditEntry(mock);
    expect(entry.action).toBe('status-change');
    expect(entry.entity).toEqual({ type: 'order', id: order.id });
    // قبل و بعد: وضعیت قدیمی و جدید سفارش
    expect(entry.before).toEqual({ status: 'requested' });
    expect(entry.after).toEqual({ status: 'awaiting_confirmation' });
    expect(entry.context).toEqual({ actorId: ADMIN.id, actorRole: 'admin' });
    // IP از درخواست استخراج شده است
    expect(entry.req).toMatchObject({ ip: '10.20.30.40' });
  });

  it('لغو سفارش رویداد cancel با دلیل می‌سازد', async () => {
    const order = mock.seedOrder({ status: 'requested' });

    await service.cancelOrder(
      CUSTOMER,
      order.id,
      'مشتری منصرف شد',
      fakeRequest(),
    );

    const entry = lastAuditEntry(mock);
    expect(entry.action).toBe('cancel');
    expect(entry.entity).toEqual({ type: 'order', id: order.id });
    expect(entry.before).toBeNull();
    expect(entry.after).toEqual({ reason: 'مشتری منصرف شد' });
  });

  it('شکست ثبت ممیزی جریان اصلی را قطع نمی‌کند', async () => {
    // سرویس ممیزی خطا می‌دهد — نباید روی نتیجه‌ی سفارش اثر بگذارد
    mock.audit.logFromRequest.mockRejectedValueOnce(new Error('db down'));

    const order = await service.createOrder(
      CUSTOMER,
      createOrderDto(),
      fakeRequest(),
    );

    expect(order.status).toBe('requested');
    expect(mock.orders.size).toBe(1);
  });
});

