import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@yuma/db';
import { PrismaService } from '../../database/prisma.service';
import { faMessages } from '../../common/messages.fa';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AdminListUsersDto } from './dto/admin-list-users.dto';
import { AdminUpdateUserStatusDto } from './dto/admin-update-user-status.dto';
import { maskMobile, type Paginated } from './users.utils';

/** حداکثر تعداد آدرس فعال برای هر کاربر */
const MAX_ADDRESSES = 5;

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
  constructor(private readonly prisma: PrismaService) {}

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

    const where: Prisma.UserWhereInput = {};

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
    const user = await this.prisma.user.findUnique({
      where: { id },
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

  // ───────────────────────── ابزارهای داخلی ─────────────────────────

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
