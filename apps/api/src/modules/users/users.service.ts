import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@yuma/db';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit-log/audit.service';
import { faMessages } from '../../common/messages.fa';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AdminListUsersDto } from './dto/admin-list-users.dto';
import { AdminUpdateUserStatusDto } from './dto/admin-update-user-status.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeUserRoleDto } from './dto/change-user-role.dto';
import { maskMobile, type Paginated } from './users.utils';

/** حداکثر تعداد آدرس فعال برای هر کاربر */
const MAX_ADDRESSES = 5;

/** تعداد دورهای هش bcrypt — منطبق با SessionService */
const BCRYPT_ROUNDS = 10;

/**
 * هش کردن رمز عبور با bcrypt — مطابق الگوی SessionService از
 * import پویا استفاده می‌کند تا هزینه‌ی بارگذاری فقط هنگام نیاز پرداخت شود.
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * نقش‌های پرسنلی که در مسیر /admin/users/staff لیست می‌شوند —
 * کاربران عملیاتی سامانه (بدون مشتریان، سفیران و کاربران قالیشویی)
 */
const STAFF_ROLES = ['admin', 'manager', 'expert', 'support', 'finance'] as const;

/**
 * فیلدهای کاربر که در رویداد ممیزی به‌عنوان وضعیت ثبت می‌شوند —
 * یک تصویر ثابت از کاربر قبل و بعد از تغییر
 */
const AUDIT_SELECT = {
  id: true,
  fullName: true,
  email: true,
  nationalCode: true,
  role: true,
  isActive: true,
} as const;

/** فیلدهای پروفایل که در خروجی API قرار می‌گیرند — بدون رمز عبور */
const PROFILE_SELECT = {
  id: true,
  mobile: true,
  fullName: true,
  email: true,
  nationalCode: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

/**
 * سرویس کاربران — مدیریت پروفایل، دفترچه آدرس مشتریان و
 * عملیات ادمین روی کاربران
 *
 * آدرس‌ها به صورت نرم (soft) حذف می‌شوند: رکورد باقی می‌ماند و
 * فیلد `deletedAt` پر می‌شود؛ کوئری‌ها آدرس‌های حذف‌شده را فیلتر می‌کنند.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ───────────────────────── پروفایل ─────────────────────────

  /** پروفایل کاربر — بدون رمز عبور */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PROFILE_SELECT,
    });

    if (!user) throw new NotFoundException(faMessages.common.notFound);

    return user;
  }

  /** به‌روزرسانی پروفایل — فقط فیلدهای ارسال‌شده تغییر می‌کنند */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          fullName: dto.fullName,
          email: dto.email,
          nationalCode: dto.nationalCode,
        },
        select: PROFILE_SELECT,
      });
    } catch (error) {
      // P2002: نقض محدودیت یکتایی — کد ملی یا ایمیل تکراری
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(faMessages.user.nationalCodeExists);
      }

      throw error;
    }
  }

  // ───────────────────────── آدرس‌ها ─────────────────────────

  /**
   * لیست آدرس‌های کاربر — آدرس پیش‌فرض ابتدای لیست.
   * آدرس‌های حذف‌شده (soft) در این لیست نیستند.
   */
  async getUserAddresses(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /** افزودن آدرس — اولین آدرس کاربر به صورت خودکار پیش‌فرض می‌شود */
  async addAddress(userId: string, dto: CreateAddressDto) {
    // فقط آدرس‌های حذف‌نشده در سقف ۵ تایی حساب می‌شوند
    const count = await this.prisma.userAddress.count({
      where: { userId, deletedAt: null },
    });

    if (count >= MAX_ADDRESSES) {
      throw new BadRequestException(faMessages.user.addressLimit);
    }

    return this.prisma.userAddress.create({
      data: {
        userId,
        title: dto.title,
        province: dto.province,
        city: dto.city,
        fullAddress: dto.fullAddress,
        postalCode: dto.postalCode,
        lat: dto.lat !== undefined ? new Prisma.Decimal(dto.lat) : undefined,
        lng: dto.lng !== undefined ? new Prisma.Decimal(dto.lng) : undefined,
        isDefault: count === 0,
      },
    });
  }

  /** ویرایش آدرس — فقط فیلدهای ارسال‌شده تغییر می‌کنند */
  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    await this.assertAddressOwnership(userId, addressId);

    try {
      return await this.prisma.userAddress.update({
        where: { id: addressId },
        data: {
          title: dto.title,
          province: dto.province,
          city: dto.city,
          fullAddress: dto.fullAddress,
          postalCode: dto.postalCode,
          lat: dto.lat !== undefined ? new Prisma.Decimal(dto.lat) : undefined,
          lng: dto.lng !== undefined ? new Prisma.Decimal(dto.lng) : undefined,
        },
      });
    } catch (error) {
      // اگر آدرس در همین لحظه توسط درخواست دیگری حذف شده باشد
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(faMessages.user.addressNotFound);
      }

      throw error;
    }
  }

  /**
   * تنظیم آدرس پیش‌فرض — در یک تراکنش:
   * ابتدا پیش‌فرض بودن همه‌ی آدرس‌های دیگر لغو می‌شود،
   * سپس این آدرس پیش‌فرض می‌گردد.
   */
  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    await this.assertAddressOwnership(userId, addressId);

    await this.prisma.$transaction([
      this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true, deletedAt: null },
        data: { isDefault: false },
      }),
      this.prisma.userAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);
  }

  /**
   * حذف نرم آدرس — رکورد پاک نمی‌شود، بلکه `deletedAt` پر می‌گردد.
   * اگر آدرس حذف‌شده پیش‌فرض بود، قدیمی‌ترین آدرس دیگر خودکار پیش‌فرض می‌شود.
   *
   * نکته: فقط یک آدرس پیش‌فرض می‌توان داشت، پس نمی‌توان همه‌ی آدرس‌های
   * باقی‌مانده را هم‌زمان پیش‌فرض کرد — قدیمی‌ترینِ آن‌ها انتخاب می‌شود.
   */
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId, deletedAt: null },
      select: { id: true, isDefault: true },
    });

    if (!address) throw new NotFoundException(faMessages.user.addressNotFound);

    // آدرسی که پس از حذف، جای پیش‌فرض را پر می‌کند
    const successor =
      address.isDefault
        ? await this.prisma.userAddress.findFirst({
            where: { userId, deletedAt: null, isDefault: false },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
          })
        : null;

    await this.prisma.$transaction([
      this.prisma.userAddress.update({
        where: { id: addressId },
        data: { deletedAt: new Date(), isDefault: false },
      }),
      // جبران پیش‌فرضِ از دست‌رفته — فقط یک جانشین
      ...(successor
        ? [
            this.prisma.userAddress.update({
              where: { id: successor.id },
              data: { isDefault: true },
            }),
          ]
        : []),
    ]);
  }

  // ───────────────────────── عملیات ادمین ─────────────────────────

  /**
   * لیست صفحه‌بندی‌شده‌ی کاربران برای پنل ادمین —
   * موبایل برای محافظت از حریم خصوصی ماسک می‌شود (0912***6789)
   */
  async listUsers(dto: AdminListUsersDto): Promise<
    Paginated<{
      id: string;
      fullName: string;
      mobile: string;
      nationalCode: string | null;
      role: string;
      isActive: boolean;
      createdAt: Date;
    }>
  > {
    const page = Math.max(1, dto.page ?? 1);
    const limit = Math.min(100, Math.max(1, dto.limit ?? 20));
    const skip = (page - 1) * limit;

    // کاربران حذف‌شده (soft) در این لیست نیستند
    const where: Prisma.UserWhereInput = { deletedAt: null };

    if (typeof dto.isActive === 'boolean') {
      where.isActive = dto.isActive;
    }

    if (dto.role) {
      where.role = dto.role;
    }

    if (dto.search?.trim()) {
      const term = dto.search.trim();

      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { mobile: { contains: term } },
        { nationalCode: { contains: term } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          mobile: true,
          nationalCode: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((user) => ({
        ...user,
        mobile: maskMobile(user.mobile),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** جزئیات یک کاربر — همراه با آدرس‌های فعال او */
  async getUserById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...PROFILE_SELECT,
        addresses: {
          where: { deletedAt: null },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!user) throw new NotFoundException(faMessages.common.notFound);

    return user;
  }

  /** فعال یا غیرفعال کردن کاربر توسط ادمین */
  async updateUserStatus(id: string, dto: AdminUpdateUserStatusDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { isActive: dto.isActive },
        select: PROFILE_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(faMessages.common.notFound);
      }

      throw error;
    }
  }

  /**
   * ساخت کاربر جدید توسط ادمین
   *
   * رمز عبور اختیاری است: با ارسال آن، با bcrypt هش می‌شود؛
   * بدون آن، `passwordHash` خالی است و اولین ورود از طریق OTP
   * انجام می‌شود (مثل مسیر احراز هویت).
   * موبایل تکراری یا کد ملی/ایمیل تکراری خطای ۴۰۹ می‌دهد.
   *
   * رویداد ساخت در ممیزی ثبت می‌شود: `log('create', 'user', id, null, user)`
   */
  async createUser(dto: CreateUserDto) {
    // رمز عبور اختیاری است — بدون رمز، ورود از طریق OTP انجام می‌شود
    const passwordHash = dto.password
      ? await hashPassword(dto.password)
      : '';

    let created;
    try {
      created = await this.prisma.user.create({
        data: {
          mobile: dto.mobile,
          fullName: dto.fullName,
          nationalCode: dto.nationalCode,
          email: dto.email,
          role: dto.role,
          passwordHash,
        },
        select: PROFILE_SELECT,
      });
    } catch (error) {
      // P2002: نقض محدودیت یکتایی — موبایل، کد ملی یا ایمیل تکراری
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta as { target?: string[] })?.target ?? [];
        const message = target.includes('mobile')
          ? faMessages.user.mobileExists
          : target.includes('email')
            ? faMessages.user.emailExists
            : faMessages.user.nationalCodeExists;

        throw new ConflictException(message);
      }

      throw error;
    }

    // ثبت در ممیزی — قبل: ندارد (کاربر تازه ساخته شده)
    await this.auditService.log('create', 'user', created.id, null, created);

    return created;
  }

  /**
   * ویرایش کاربر توسط ادمین — فقط فیلدهای ارسال‌شده تغییر می‌کنند.
   *
   * ادمین نمی‌تواند نقش حساب خودش را تغییر دهد تا امکان لاک‌اوت
   * خودکار از پنل برطرف نشود. تغییر نقش دیگران از همین مسیر یا
   * مسیر تخصصی /role امکان‌پذیر است.
   *
   * رویداد ویرایش در ممیزی ثبت می‌شود: `log('update', 'user', id, before, after)`
   */
  async updateUser(actorId: string, id: string, dto: UpdateUserDto) {
    const before = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: AUDIT_SELECT,
    });

    if (!before) throw new NotFoundException(faMessages.common.notFound);

    // جلوگیری از تغییر نقش حساب خودمان — فقط وقتی نقش واقعاً تغییر می‌کند
    if (
      dto.role !== undefined &&
      dto.role !== before.role &&
      actorId === id
    ) {
      throw new BadRequestException(faMessages.user.cannotChangeOwnRole);
    }

    let after;
    try {
      after = await this.prisma.user.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          nationalCode: dto.nationalCode,
          email: dto.email,
          isActive: dto.isActive,
          role: dto.role,
        },
        select: PROFILE_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta as { target?: string[] })?.target ?? [];
        throw new ConflictException(
          target.includes('email')
            ? faMessages.user.emailExists
            : faMessages.user.nationalCodeExists,
        );
      }

      // P2025: کاربر مورد نظر وجود ندارد
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(faMessages.common.notFound);
      }

      throw error;
    }

    // ثبت در ممیزی — قبل و بعد از تغییر
    await this.auditService.log('update', 'user', id, before, after);

    return after;
  }

  /**
   * حذف نرم کاربر — رکورد پاک نمی‌شود، بلکه `deletedAt` پر می‌گردد
   * و حساب غیرفعال می‌شود تا نشست‌های بازش بلافاصله باطل شوند.
   *
   * ادمین نمی‌تواند حساب خودش را حذف کند. آخرین مدیر فعال سیستم هم
   * قابل حذف نیست تا پنل ادمین بدون مدیر نماند. حذف تکراری هم ۴۰۴
   * می‌دهد، چون کاربر دیگر در لیست «فعال» نیست.
   *
   * رویداد حذف در ممیزی ثبت می‌شود: `log('delete', 'user', id, before, null)`
   */
  async deleteUser(actorId: string, id: string): Promise<void> {
    if (actorId === id) {
      throw new BadRequestException(faMessages.user.cannotDeleteSelf);
    }

    const before = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: AUDIT_SELECT,
    });

    if (!before) {
      const anyUser = await this.prisma.user.findUnique({
        where: { id },
        select: { deletedAt: true },
      });

      throw new NotFoundException(
        anyUser?.deletedAt
          ? faMessages.user.alreadyDeleted
          : faMessages.common.notFound,
      );
    }

    // حفظ حداقل یک مدیر فعال در سیستم
    if (before.role === 'admin') {
      const activeAdmins = await this.prisma.user.count({
        where: { role: 'admin', isActive: true, deletedAt: null },
      });

      if (activeAdmins <= 1) {
        throw new BadRequestException(faMessages.user.cannotDeleteLastAdmin);
      }
    }

    const result = await this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false },
    });

    if (result.count === 0) {
      // کاربر در همین لحظه توسط درخواست دیگری حذف شده است
      throw new NotFoundException(faMessages.user.alreadyDeleted);
    }

    // ثبت در ممیزی — بعد: ندارد (کاربر حذف شده)
    await this.auditService.log('delete', 'user', id, before, null);
  }

  /**
   * لیست پرسنل سامانه — مسیر GET /admin/users/staff
   *
   * فقط کاربران عملیاتی (admin, manager, expert, support, finance)
   * برمی‌گردند؛ مشتریان، سفیران و کاربران قالیشویی شامل نمی‌شوند.
   * موبایل ماسک نمی‌شود چون این لیست برای تماس با پرسنل است.
   */
  async listStaff() {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        role: { in: [...STAFF_ROLES] },
      },
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
      select: {
        id: true,
        fullName: true,
        mobile: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  /**
   * تغییر نقش کاربر توسط ادمین
   *
   * آخرین مدیر سیستم را نمی‌توان به نقش دیگری تغییر داد تا
   * قفل شدن پنل ادمین غیرممکن بماند.
   *
   * رویداد تغییر نقش در ممیزی ثبت می‌شود:
   * `log('change-role', 'user', id, { role: before }, { role: after })`
   */
  async changeUserRole(id: string, dto: ChangeUserRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(faMessages.common.notFound);
    }

    // بدون تغییر، بدون رویداد ممیزی — وضعیت فعلی همان خروجی است
    if (user.role === dto.role) {
      return this.snapshot(id);
    }

    // حفظ حداقل یک مدیر فعال در سیستم
    if (user.role === 'admin' && dto.role !== 'admin') {
      const activeAdmins = await this.prisma.user.count({
        where: { role: 'admin', isActive: true, deletedAt: null },
      });

      if (activeAdmins <= 1) {
        throw new BadRequestException(faMessages.user.lastAdmin);
      }
    }

    let after;
    try {
      after = await this.prisma.user.update({
        where: { id },
        data: { role: dto.role },
        select: PROFILE_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(faMessages.common.notFound);
      }

      throw error;
    }

    // ثبت در ممیزی — فقط نقش قبل و بعد
    await this.auditService.log(
      'change-role',
      'user',
      id,
      { role: user.role },
      { role: after.role },
    );

    return after;
  }

  // ───────────────────────── ابزارهای داخلی ─────────────────────────

  /**
   * خواندن نمای کاربر برای خروجی API — معادل `select: PROFILE_SELECT`.
   * برای مسیرهایی که تغییری ایجاد نکرده‌اند اما باید نمای کامل برگردانند.
   */
  private async snapshot(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id },
      select: PROFILE_SELECT,
    });

    if (!user) throw new NotFoundException(faMessages.common.notFound);

    return user;
  }

  /**
   * اطمینان از اینکه آدرس متعلق به این کاربر و حذف‌نشده است —
   * در غیر این صورت ۴۰۴ پرتاب می‌شود
   */
  private async assertAddressOwnership(
    userId: string,
    addressId: string,
  ): Promise<void> {
    const address = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!address) throw new NotFoundException(faMessages.user.addressNotFound);
  }
}
