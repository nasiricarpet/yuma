import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@yuma/db';
import { UsersService } from './users.service';
import { maskMobile } from './users.utils';

/** ساخت خطای واقعی Prisma تا شاخه‌ی `instanceof` سرویس اجرا شود */
function prismaError(code: string): unknown {
  return new Prisma.PrismaClientKnownRequestError('خطای آزمایشی', {
    code,
    clientVersion: 'test',
  });
}

/**
 * Prisma جعلی — فقط متدهایی که سرویس فراخوانی می‌کند پیاده‌سازی شده‌اند.
 * هر متد یک لیست از آرگومان‌های دریافتی را نگه می‌دارد تا در تست‌ها بررسی شوند.
 */
function createPrismaMock() {
  const users = new Map<string, any>();
  const addresses = new Map<string, any>();
  let addressSeq = 0;
  const transactions: unknown[][] = [];

  const userAddress = {
    count: jest.fn(async ({ where }: { where: any }) => {
      let items = [...addresses.values()];
      if (where?.deletedAt === null) items = items.filter((a) => !a.deletedAt);
      return items.filter((a) => a.userId === where.userId).length;
    }),
    findMany: jest.fn(async ({ where }: { where: any }) => {
      let items = [...addresses.values()].filter((a) => a.userId === where.userId);
      if (where?.deletedAt === null) items = items.filter((a) => !a.deletedAt);
      return items.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
    }),
    findFirst: jest.fn(
      async ({
        where,
        orderBy,
        select,
      }: {
        where: any;
        orderBy?: any;
        select?: any;
      }) => {
        // جستجوی مستقیم با شناسه — بررسی مالکیت یا یافتن رکورد هدف
        if (where.id !== undefined) {
          const item = addresses.get(where.id);
          if (!item || item.userId !== where.userId || item.deletedAt)
            return null;

          const picked: Record<string, unknown> = {};
          if (!select || select.id) picked.id = item.id;
          if (!select || select.isDefault) picked.isDefault = item.isDefault;
          return picked;
        }

        // انتخاب جانشین: قدیمی‌ترین آدرس حذف‌نشده، با احترام به فیلترها
        let items = [...addresses.values()].filter(
          (a) => a.userId === where.userId && !a.deletedAt,
        );
        if (where.isDefault === false) items = items.filter((a) => !a.isDefault);
        if (where.isDefault === true) items = items.filter((a) => a.isDefault);
        if (orderBy?.createdAt === 'asc')
          items.sort((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf());

        const first = items[0];
        if (!first) return null;
        return select?.id ? { id: first.id } : { ...first };
      },
    ),
    create: jest.fn(async ({ data }: { data: any }) => {
      const id = `addr-${++addressSeq}`;
      const record = {
        id,
        deletedAt: null,
        createdAt: new Date(),
        ...data,
      };
      addresses.set(id, record);
      return record;
    }),
    update: jest.fn(async ({ where, data }: { where: any; data: any }) => {
      const item = addresses.get(where.id);
      if (!item) throw prismaError('P2025');
      // Prisma مقادیر undefined را نادیده می‌گیرد — اینجا هم همین رفتار تقلید می‌شود
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) item[key] = value;
      }
      return item;
    }),
    updateMany: jest.fn(async ({ where, data }: { where: any; data: any }) => {
      let count = 0;
      for (const item of addresses.values()) {
        if (item.userId !== where.userId) continue;
        if (where.id !== undefined && item.id !== where.id) continue;
        if (where.isDefault === true && !item.isDefault) continue;
        if (where.isDefault === false && item.isDefault) continue;
        if (where.deletedAt === null && item.deletedAt) continue;
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined) item[key] = value;
        }
        count++;
      }
      return { count };
    }),
  };

  const user = {
    findUnique: jest.fn(async ({ where }: { where: any }) => {
      const found = users.get(where.id);
      if (!found) return null;
      // کوئری‌های include/select ممکن است آدرس‌ها را بخواهند
      return { ...found, addresses: [...addresses.values()].filter(
        (a) => a.userId === where.id && !a.deletedAt,
      ) };
    }),
    findMany: jest.fn(async () => [...users.values()]),
    count: jest.fn(async () => users.size),
    update: jest.fn(async ({ where, data }: { where: any; data: any }) => {
      const item = users.get(where.id);
      if (!item) throw prismaError('P2025');
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) item[key] = value;
      }
      return item;
    }),
  };

  return {
    user,
    userAddress,
    $transaction: jest.fn(async (ops: unknown[]) => {
      transactions.push(ops);
      for (const op of ops) {
        const fn = (op as { update?: unknown; updateMany?: unknown });
        if (typeof fn?.update === 'function') await (fn.update as () => unknown)();
        if (typeof fn?.updateMany === 'function') await (fn.updateMany as () => unknown)();
      }
    }),
    // دسترسی مستقیم به مخزن برای آماده‌سازی هر تست
    _users: users,
    _addresses: addresses,
    _transactions: transactions,
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const USER_ID = 'user-1';

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new UsersService(prisma as never);

    prisma._users.set(USER_ID, {
      id: USER_ID,
      mobile: '09123456789',
      fullName: 'یوما',
      email: null,
      nationalCode: null,
      role: 'customer',
      isActive: true,
      createdAt: new Date(),
    });
  });

  describe('پروفایل', () => {
    it('پروفایل کاربر را برمی‌گرداند', async () => {
      const profile = await service.getProfile(USER_ID);

      expect(profile.mobile).toBe('09123456789');
    });

    it('برای کاربر ناموجود ۴۰۴ می‌دهد', async () => {
      await expect(service.getProfile('nope')).rejects.toThrow(NotFoundException);
    });

    it('فقط فیلدهای ارسال‌شده را به‌روز می‌کند', async () => {
      await service.updateProfile(USER_ID, {
        fullName: 'یوماکرپیت',
        nationalCode: '1111111111',
      });

      const stored = prisma._users.get(USER_ID);
      expect(stored?.fullName).toBe('یوماکرپیت');
      expect(stored?.nationalCode).toBe('1111111111');
    });

    it('تکرار کد ملی/ایمیل ۴۰۹ می‌دهد', async () => {
      jest
        .spyOn(prisma.user, 'update')
        .mockRejectedValueOnce(prismaError('P2002'));

      await expect(
        service.updateProfile(USER_ID, { nationalCode: '2222222222' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('آدرس‌ها', () => {
    it('اولین آدرس خودکار پیش‌فرض می‌شود', async () => {
      const first = await service.addAddress(USER_ID, {
        title: 'خانه',
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'خیابان اصلی',
        postalCode: '1111111111',
      });

      expect(first.isDefault).toBe(true);
    });

    it('آدرس دوم پیش‌فرض نیست', async () => {
      await service.addAddress(USER_ID, {
        title: 'خانه',
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'خیابان اصلی',
        postalCode: '1111111111',
      });

      const second = await service.addAddress(USER_ID, {
        title: 'محل کار',
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'خیابان فرعی',
        postalCode: '2222222222',
      });

      expect(second.isDefault).toBe(false);
    });

    it('بیشتر از ۵ آدرس ۴۰۰ می‌دهد', async () => {
      for (let i = 0; i < 5; i++) {
        await service.addAddress(USER_ID, {
          title: `آدرس ${i}`,
          province: 'تهران',
          city: 'تهران',
          fullAddress: `خیابان ${i}`,
          postalCode: `${i}${'1'.repeat(9)}`,
        });
      }

      await expect(
        service.addAddress(USER_ID, {
          title: 'ششم',
          province: 'تهران',
          city: 'تهران',
          fullAddress: 'خیابان ششم',
          postalCode: '9999999999',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('تنظیم پیش‌فرض، آدرس قبلی را غیرپیش‌فرض می‌کند', async () => {
      const first = await service.addAddress(USER_ID, {
        title: 'خانه',
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'خیابان اصلی',
        postalCode: '1111111111',
      });
      const second = await service.addAddress(USER_ID, {
        title: 'محل کار',
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'خیابان فرعی',
        postalCode: '2222222222',
      });

      await service.setDefaultAddress(USER_ID, second.id);

      // تراکنش شامل لغو پیش‌فرض قبلی و تنظیم جدید است
      const lastTx = prisma._transactions[prisma._transactions.length - 1];
      expect(lastTx).toHaveLength(2);

      expect(prisma._addresses.get(first.id)?.isDefault).toBe(false);
      expect(prisma._addresses.get(second.id)?.isDefault).toBe(true);
    });

    it('تنظیم پیش‌فرض روی آدرس ناموجود ۴۰۴ می‌دهد', async () => {
      await expect(
        service.setDefaultAddress(USER_ID, 'nope'),
      ).rejects.toThrow(NotFoundException);
    });

    it('ویرایش فقط فیلدهای ارسال‌شده را تغییر می‌دهد', async () => {
      const addr = await service.addAddress(USER_ID, {
        title: 'خانه',
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'خیابان اصلی',
        postalCode: '1111111111',
      });

      await service.updateAddress(USER_ID, addr.id, { title: 'خانه جدید' });

      const stored = prisma._addresses.get(addr.id);
      expect(stored?.title).toBe('خانه جدید');
      expect(stored?.city).toBe('تهران');
    });

    it('حذف، آدرس را soft-delete می‌کند و از لیست می‌اندازد', async () => {
      const addr = await service.addAddress(USER_ID, {
        title: 'خانه',
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'خیابان اصلی',
        postalCode: '1111111111',
      });

      await service.deleteAddress(USER_ID, addr.id);

      expect(prisma._addresses.get(addr.id)?.deletedAt).toBeInstanceOf(Date);

      const list = await service.getUserAddresses(USER_ID);
      expect(list).toHaveLength(0);
    });

    it('حذف آدرس پیش‌فرض، آدرس دیگر را پیش‌فرض می‌کند', async () => {
      const first = await service.addAddress(USER_ID, {
        title: 'خانه',
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'خیابان اصلی',
        postalCode: '1111111111',
      });
      await service.addAddress(USER_ID, {
        title: 'محل کار',
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'خیابان فرعی',
        postalCode: '2222222222',
      });

      await service.deleteAddress(USER_ID, first.id);

      // آدرس پیش‌فرضِ جدید بلافاصله بعد از لغو اولی تنظیم می‌شود
      const others = [...prisma._addresses.values()].filter((a) => !a.deletedAt);
      expect(others.filter((a) => a.isDefault)).toHaveLength(1);
    });

    it('حذف پیش‌فرض، فقط یک آدرس دیگر را پیش‌فرض می‌کند', async () => {
      const first = await service.addAddress(USER_ID, {
        title: 'خانه',
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'خیابان اصلی',
        postalCode: '1111111111',
      });
      await service.addAddress(USER_ID, {
        title: 'محل کار',
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'خیابان فرعی',
        postalCode: '2222222222',
      });
      await service.addAddress(USER_ID, {
        title: 'ویلا',
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'خیابان دور',
        postalCode: '3333333333',
      });

      await service.deleteAddress(USER_ID, first.id);

      // حتی با چند آدرس باقی‌مانده، فقط یک پیش‌فرض مجاز است
      const others = [...prisma._addresses.values()].filter(
        (a) => !a.deletedAt,
      );
      expect(others.filter((a) => a.isDefault)).toHaveLength(1);
    });

    it('حذف آدرس کاربر دیگر ۴۰۴ می‌دهد', async () => {
      const addr = await service.addAddress(USER_ID, {
        title: 'خانه',
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'خیابان اصلی',
        postalCode: '1111111111',
      });

      await expect(service.deleteAddress('user-2', addr.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('عملیات ادمین', () => {
    it('لیست کاربران صفحه‌بندی و موبایل ماسک‌شده برمی‌گرداند', async () => {
      const result = await service.listUsers({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].mobile).toBe('0912***6789');
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('جزئیات کاربر را با آدرس‌های فعال برمی‌گرداند', async () => {
      await service.addAddress(USER_ID, {
        title: 'خانه',
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'خیابان اصلی',
        postalCode: '1111111111',
      });

      const detail = await service.getUserById(USER_ID);
      expect(detail.addresses).toHaveLength(1);
    });

    it('جزئیات کاربر ناموجود ۴۰۴ می‌دهد', async () => {
      await expect(service.getUserById('nope')).rejects.toThrow(NotFoundException);
    });

    it('وضعیت کاربر را تغییر می‌دهد', async () => {
      await service.updateUserStatus(USER_ID, { isActive: false });

      expect(prisma._users.get(USER_ID)?.isActive).toBe(false);
    });

    it('تغییر وضعیت کاربر ناموجود ۴۰۴ می‌دهد', async () => {
      await expect(
        service.updateUserStatus('nope', { isActive: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

describe('maskMobile', () => {
  it('۴ رقم اول و ۴ رقم آخر را نگه می‌دارد', () => {
    expect(maskMobile('09123456789')).toBe('0912***6789');
  });

  it('موبایل نامعتبر را دست‌نخورده برمی‌گرداند', () => {
    expect(maskMobile('123')).toBe('123');
  });
});
