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
  let userSeq = 0;
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
    findFirst: jest.fn(
      async ({
        where,
        select,
      }: {
        where: any;
        select?: any;
      }) => {
        const item = users.get(where.id);
        if (!item) return null;
        // کاربران حذف‌شده (soft) معادل «موجود نیست» هستند
        if (where.deletedAt === null && item.deletedAt) return null;

        let picked: Record<string, unknown> = { ...item };
        if (select) {
          picked = {};
          for (const key of Object.keys(select)) {
            if (!select[key]) continue;
            picked[key] = item[key];
          }
          if (select.addresses) {
            picked.addresses = [...addresses.values()].filter(
              (a) => a.userId === where.id && !a.deletedAt,
            );
          }
        }
        return picked;
      },
    ),
    findMany: jest.fn(async ({ where }: { where?: any } = {}) => {
      let items = [...users.values()];
      if (where?.deletedAt === null) items = items.filter((u) => !u.deletedAt);
      if (where?.role) {
        const roles: string[] = Array.isArray(where.role)
          ? where.role
          : where.role.in ?? [where.role];
        items = items.filter((u) => roles.includes(u.role));
      }
      return items;
    }),
    count: jest.fn(async ({ where }: { where?: any } = {}) => {
      let items = [...users.values()];
      if (where?.deletedAt === null) items = items.filter((u) => !u.deletedAt);
      if (where?.deletedAt?.not === null) items = items.filter((u) => u.deletedAt);
      if (where?.role) items = items.filter((u) => u.role === where.role);
      if (typeof where?.isActive === 'boolean')
        items = items.filter((u) => u.isActive === where.isActive);
      return items.length;
    }),
    create: jest.fn(async ({ data }: { data: any }) => {
      const id = `user-${++userSeq}`;
      const record = {
        id,
        deletedAt: null,
        createdAt: new Date(),
        ...data,
      };
      users.set(id, record);
      return record;
    }),
    update: jest.fn(async ({ where, data }: { where: any; data: any }) => {
      const item = users.get(where.id);
      if (!item) throw prismaError('P2025');
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) item[key] = value;
      }
      return item;
    }),
    updateMany: jest.fn(async ({ where, data }: { where: any; data: any }) => {
      const item = users.get(where.id);
      if (!item) return { count: 0 };
      // حذف تکراری روی کاربر قبلاً حذف‌شده اثری ندارد
      if (where.deletedAt === null && item.deletedAt) return { count: 0 };

      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) item[key] = value;
      }
      return { count: 1 };
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

/**
 * پارامترهای `AuditService.log` — برای بررسی رویدادهای ثبت‌شده در تست‌ها.
 * مطابق قرارداد ماژول ممیزی: (action, entityType, entityId, before, after)
 */
type AuditLogArgs = [
  action: string,
  entityType: string,
  entityId: string | null,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
];

/**
 * سرویس ممیزی جعلی — فقط `log` فراخوانی می‌شود. آرگومان‌ها برای
 * بررسی رویدادهای ثبت‌شده نگه داشته می‌شوند.
 */
function createAuditMock() {
  return {
    log: jest.fn<Promise<void>, AuditLogArgs>(),
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let audit: ReturnType<typeof createAuditMock>;

  const USER_ID = 'user-1';

  beforeEach(() => {
    prisma = createPrismaMock();
    audit = createAuditMock();
    service = new UsersService(prisma as never, audit as never);

    prisma._users.set(USER_ID, {
      id: USER_ID,
      mobile: '09123456789',
      fullName: 'یوما',
      email: null,
      nationalCode: null,
      role: 'customer',
      isActive: true,
      deletedAt: null,
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

  describe('عملیات ادمین — مدیریت کاربران', () => {
    it('کاربر جدید با نقش می‌سازد', async () => {
      const created = await service.createUser({
        mobile: '09121112222',
        fullName: 'کاربر جدید',
        role: 'laundry_manager',
      });

      expect(created.role).toBe('laundry_manager');

      const stored = [...prisma._users.values()].find(
        (u) => u.mobile === '09121112222',
      );
      expect(stored?.fullName).toBe('کاربر جدید');
      // کاربر ساخته‌شده توسط ادمین رمز عبور ندارد — ورود با OTP
      expect(stored?.passwordHash).toBe('');
    });

    it('موبایل تکراری ۴۰۹ می‌دهد', async () => {
      jest
        .spyOn(prisma.user, 'create')
        .mockRejectedValueOnce(prismaError('P2002'));

      await expect(
        service.createUser({
          mobile: '09123456789',
          fullName: 'تکراری',
          role: 'customer',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('فقط فیلدهای ارسال‌شده را در ویرایش تغییر می‌دهد', async () => {
      await service.updateUser('admin-1', USER_ID, { fullName: 'یوما ویرایش‌شده' });

      const stored = prisma._users.get(USER_ID);
      expect(stored?.fullName).toBe('یوما ویرایش‌شده');
      expect(stored?.mobile).toBe('09123456789');
    });

    it('تکرار کد ملی/ایمیل در ویرایش ۴۰۹ می‌دهد', async () => {
      jest
        .spyOn(prisma.user, 'update')
        .mockRejectedValueOnce(prismaError('P2002'));

      await expect(
        service.updateUser('admin-1', USER_ID, { email: 'dup@yuma.local' }),
      ).rejects.toThrow(ConflictException);
    });

    it('ویرایش کاربر ناموجود ۴۰۴ می‌دهد', async () => {
      await expect(
        service.updateUser('admin-1', 'nope', { fullName: 'فلان' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('کاربر را soft-delete می‌کند و غیرفعال می‌کند', async () => {
      await service.deleteUser('admin-1', USER_ID);

      const stored = prisma._users.get(USER_ID);
      expect(stored?.deletedAt).toBeInstanceOf(Date);
      expect(stored?.isActive).toBe(false);
    });

    it('حذف حساب خودمان ۴۰۰ می‌دهد', async () => {
      await expect(service.deleteUser(USER_ID, USER_ID)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma._users.get(USER_ID)?.deletedAt).toBeNull();
    });

    it('حذف کاربر ناموجود ۴۰۴ می‌دهد', async () => {
      await expect(service.deleteUser('admin-1', 'nope')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('حذف کاربر قبلاً حذف‌شده ۴۰۴ می‌دهد', async () => {
      await service.deleteUser('admin-1', USER_ID);

      // حذف دوباره نباید موفق (یا idempotent) باشد
      await expect(service.deleteUser('admin-1', USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('کاربر حذف‌شده از لیست و جزئیات خارج می‌شود', async () => {
      await service.deleteUser('admin-1', USER_ID);

      const list = await service.listUsers({ page: 1, limit: 10 });
      expect(list.items).toHaveLength(0);

      await expect(service.getUserById(USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('رمز عبور ارسال‌شده را هش می‌کند و بدون رمز، خالی می‌ماند', async () => {
      await service.createUser({
        mobile: '09121113333',
        fullName: 'کاربر با رمز',
        role: 'manager',
        password: 'secret1234',
      });

      const withPassword = [...prisma._users.values()].find(
        (u) => u.mobile === '09121113333',
      );
      // رمز خام نباید به شکل متن ذخیره شود
      expect(withPassword?.passwordHash).not.toBe('secret1234');
      expect(withPassword?.passwordHash).not.toBe('');

      const bcrypt = await import('bcrypt');
      expect(
        await bcrypt.compare('secret1234', withPassword!.passwordHash),
      ).toBe(true);

      // بدون رمز — مانند مسیر OTP، passwordHash خالی است
      await service.createUser({
        mobile: '09121114444',
        fullName: 'کاربر بدون رمز',
        role: 'support',
      });
      const noPassword = [...prisma._users.values()].find(
        (u) => u.mobile === '09121114444',
      );
      expect(noPassword?.passwordHash).toBe('');
    });

    it('نقش کاربر را تغییر می‌دهد', async () => {
      const updated = await service.changeUserRole(USER_ID, {
        role: 'driver',
      });

      expect(updated.role).toBe('driver');
      expect(prisma._users.get(USER_ID)?.role).toBe('driver');
    });

    it('تغییر نقش کاربر ناموجود ۴۰۴ می‌دهد', async () => {
      await expect(
        service.changeUserRole('nope', { role: 'driver' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('آخرین ادمین را نمی‌توان به نقش دیگری تغییر داد', async () => {
      prisma._users.set('admin-1', {
        id: 'admin-1',
        mobile: '09120000000',
        fullName: 'مدیر سیستم',
        email: null,
        nationalCode: null,
        passwordHash: '',
        role: 'admin',
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
      });

      await expect(
        service.changeUserRole('admin-1', { role: 'customer' }),
      ).rejects.toThrow(BadRequestException);

      // ادمین دوم اجازه می‌دهد اولی تنزل پیدا کند
      prisma._users.set('admin-2', {
        ...prisma._users.get('admin-1'),
        id: 'admin-2',
        mobile: '09120000009',
      });

      await expect(
        service.changeUserRole('admin-1', { role: 'customer' }),
      ).resolves.toBeDefined();
    });

    it('تغییر نقش کاربر حذف‌شده ۴۰۴ می‌دهد', async () => {
      await service.deleteUser('admin-1', USER_ID);

      await expect(
        service.changeUserRole(USER_ID, { role: 'driver' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * بلوک یکپارچه‌سازی ممیزی — هر عملیات ادمین باید یک رویداد
   * با بار دقیق در AuditService ثبت کند.
   */
  describe('عملیات ادمین — ثبت ممیزی', () => {
    const ADMIN_ID = 'admin-1';

    beforeEach(() => {
      prisma._users.set(ADMIN_ID, {
        id: ADMIN_ID,
        mobile: '09120000000',
        fullName: 'مدیر سیستم',
        email: null,
        nationalCode: null,
        passwordHash: '',
        role: 'admin',
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
      });
    });

    it('ساخت کاربر، رویداد create با نقش را ثبت می‌کند', async () => {
      const created = await service.createUser({
        mobile: '09121112222',
        fullName: 'کاربر جدید',
        role: 'manager',
      });

      expect(audit.log).toHaveBeenCalledTimes(1);
      const [action, entityType, entityId, before, after] =
        audit.log.mock.calls[0];

      expect(action).toBe('create');
      expect(entityType).toBe('user');
      expect(entityId).toBe(created.id);
      // کاربر تازه ساخته‌شده وضعیت قبلی ندارد
      expect(before).toBeNull();
      expect(after).toMatchObject({
        id: created.id,
        fullName: 'کاربر جدید',
        role: 'manager',
      });
    });

    it('ویرایش کاربر، رویداد update با قبل و بعد را ثبت می‌کند', async () => {
      const before = await service.updateUser(ADMIN_ID, USER_ID, {
        fullName: 'یوما ویرایش‌شده',
      });

      expect(audit.log).toHaveBeenCalledTimes(1);
      const [action, , entityId, beforeSnap, afterSnap] =
        audit.log.mock.calls[0];

      expect(action).toBe('update');
      expect(entityId).toBe(USER_ID);
      // تصویر قبل از تغییر — نام قدیمی
      expect(beforeSnap?.fullName).toBe('یوما');
      expect(afterSnap).toMatchObject({
        id: USER_ID,
        fullName: 'یوما ویرایش‌شده',
        role: before.role,
      });
    });

    it('soft delete، رویداد delete با قبل و null را ثبت می‌کند', async () => {
      await service.deleteUser(ADMIN_ID, USER_ID);

      const stored = prisma._users.get(USER_ID);
      expect(stored?.deletedAt).toBeInstanceOf(Date);

      expect(audit.log).toHaveBeenCalledTimes(1);
      const [action, , entityId, beforeSnap, afterSnap] =
        audit.log.mock.calls[0];

      expect(action).toBe('delete');
      expect(entityId).toBe(USER_ID);
      expect(beforeSnap).toMatchObject({ id: USER_ID, role: 'customer' });
      // کاربر حذف‌شده وضعیت بعدی ندارد
      expect(afterSnap).toBeNull();
    });

    it('تغییر نقش، رویداد change-role با نقش قبل و بعد را ثبت می‌کند', async () => {
      await service.changeUserRole(USER_ID, { role: 'driver' });

      expect(audit.log).toHaveBeenCalledTimes(1);
      const [action, , entityId, before, after] = audit.log.mock.calls[0];

      expect(action).toBe('change-role');
      expect(entityId).toBe(USER_ID);
      expect(before).toEqual({ role: 'customer' });
      expect(after).toEqual({ role: 'driver' });
    });

    it('حذف حساب خودمان ۴۰۰ می‌دهد و چیزی ثبت نمی‌کند', async () => {
      await expect(service.deleteUser(ADMIN_ID, ADMIN_ID)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma._users.get(ADMIN_ID)?.deletedAt).toBeNull();
      // شکست زودهنگام — نباید به ممیزی برسد
      expect(audit.log).not.toHaveBeenCalled();
    });

    it('حذف آخرین ادمین ۴۰۰ می‌دهد و چیزی ثبت نمی‌کند', async () => {
      // ADMIN_ID تنها مدیر فعال سامانه است
      await expect(service.deleteUser(USER_ID, ADMIN_ID)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma._users.get(ADMIN_ID)?.deletedAt).toBeNull();
      expect(audit.log).not.toHaveBeenCalled();

      // با افزودن ادمین دوم، حذف اولی مجاز می‌شود
      prisma._users.set('admin-2', {
        ...prisma._users.get(ADMIN_ID)!,
        id: 'admin-2',
        mobile: '09120000009',
      });

      await service.deleteUser('admin-2', ADMIN_ID);

      expect(prisma._users.get(ADMIN_ID)?.deletedAt).toBeInstanceOf(Date);
      expect(audit.log).toHaveBeenCalledTimes(1);
    });

    it('لیست پرسنل فقط نقش‌های عملیاتی را برمی‌گرداند', async () => {
      prisma._users.set('driver-1', {
        id: 'driver-1',
        mobile: '09120000001',
        fullName: 'سفیر',
        email: null,
        nationalCode: null,
        passwordHash: '',
        role: 'driver',
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
      });
      prisma._users.set('manager-1', {
        id: 'manager-1',
        mobile: '09120000002',
        fullName: 'مدیر عملیات',
        email: null,
        nationalCode: null,
        passwordHash: '',
        role: 'manager',
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
      });

      const staff = await service.listStaff();

      const roles = staff.map((u) => u.role);
      expect(roles).not.toContain('customer');
      expect(roles).not.toContain('driver');
      expect(roles).toContain('admin');
      expect(roles).toContain('manager');

      // فیلدهای مورد نیاز لیست پرسنل در پنل ادمین
      const manager = staff.find((u) => u.id === 'manager-1');
      expect(manager).toMatchObject({
        fullName: 'مدیر عملیات',
        mobile: '09120000002',
        email: null,
        role: 'manager',
        isActive: true,
      });
      expect(manager?.createdAt).toBeInstanceOf(Date);
    });

    it('تغییر نقش حساب خودمان از مسیر update ۴۰۰ می‌دهد', async () => {
      await expect(
        service.updateUser(ADMIN_ID, ADMIN_ID, { role: 'customer' }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma._users.get(ADMIN_ID)?.role).toBe('admin');
      expect(audit.log).not.toHaveBeenCalled();

      // ارسال همان نقش فعلی خطا نیست
      await expect(
        service.updateUser(ADMIN_ID, ADMIN_ID, { role: 'admin' }),
      ).resolves.toBeDefined();
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
