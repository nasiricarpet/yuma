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

/** حداکثر تعداد آدرس برای هر کاربر */
const MAX_ADDRESSES = 5;

/**
 * سرویس کاربران — مدیریت پروفایل و دفترچه آدرس مشتریان
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** پروفایل کاربر — بدون رمز عبور */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mobile: true,
        fullName: true,
        nationalCode: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException(faMessages.common.notFound);

    return user;
  }

  /** به‌روزرسانی پروفایل — فقط فیلدهای ارسال‌شده تغییر می‌کنند */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          fullName: dto.fullName,
          nationalCode: dto.nationalCode,
        },
        select: {
          id: true,
          mobile: true,
          fullName: true,
          nationalCode: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      return user;
    } catch (error) {
      // P2002: نقض محدودیت یکتایی — معمولاً کد ملی تکراری
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(faMessages.user.nationalCodeExists);
      }

      throw error;
    }
  }

  /** افزودن آدرس — اولین آدرس کاربر به صورت خودکار پیش‌فرض می‌شود */
  async addAddress(userId: string, dto: CreateAddressDto) {
    const count = await this.prisma.userAddress.count({ where: { userId } });

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

  /** لیست آدرس‌های کاربر — آدرس پیش‌فرض ابتدای لیست */
  async getUserAddresses(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /** تنظیم آدرس پیش‌فرض — تراکنش: لغو پیش‌فرض بقیه و انتخاب آدرس موردنظر */
  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    await this.assertAddressOwnership(userId, addressId);

    await this.prisma.$transaction([
      this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      this.prisma.userAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);
  }

  /** حذف آدرس */
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    await this.assertAddressOwnership(userId, addressId);

    await this.prisma.userAddress.delete({ where: { id: addressId } });
  }

  /** اطمینان از اینکه آدرس متعلق به کاربر است — در غیر این صورت ۴۰۴ */
  private async assertAddressOwnership(
    userId: string,
    addressId: string,
  ): Promise<void> {
    const address = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId },
      select: { id: true },
    });

    if (!address) throw new NotFoundException(faMessages.user.addressNotFound);
  }
}
