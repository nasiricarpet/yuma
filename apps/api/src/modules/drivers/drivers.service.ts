import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@yuma/db';
import { PrismaService } from '../../database/prisma.service';
import { faMessages } from '../../common/messages.fa';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { LogLocationDto } from './dto/log-location.dto';

/**
 * سرویس سفیران — پروفایل، دسترسی‌پذیری و موقعیت لحظه‌ای
 *
 * هر سفیر فقط پروفایل خودش (بر اساس userId) را مدیریت می‌کند
 * و مالکیت در تمام متدها پیش از هر عملیاتی بررسی می‌شود.
 */
@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * یافتن پروفایل سفیر متصل به این کاربر —
   * در صورت نبود NotFoundException پرتاب می‌شود
   */
  async getMyProfile(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) throw new NotFoundException(faMessages.driver.notFound);

    return driver;
  }

  /** آپدیت پروفایل سفیر — ابتدا مالکیت بررسی می‌شود */
  async updateMyProfile(userId: string, dto: UpdateDriverDto) {
    const driver = await this.getMyProfile(userId);

    // فیلدهای ارسال‌نشده (undefined) توسط Prisma تغییر نمی‌کنند
    return this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        vehicleType: dto.vehicleType,
        plateNumber: dto.plateNumber,
      },
    });
  }

  /** تغییر وضعیت دسترسی‌پذیری سفیر — isActive برعکس می‌شود */
  async toggleAvailability(userId: string) {
    const driver = await this.getMyProfile(userId);

    return this.prisma.driver.update({
      where: { id: driver.id },
      data: { isActive: !driver.isActive },
    });
  }

  /** ثبت موقعیت لحظه‌ای سفیر — یک رکورد در DriverLocationLog */
  async logLocation(userId: string, dto: LogLocationDto) {
    const driver = await this.getMyProfile(userId);

    return this.prisma.driverLocationLog.create({
      data: {
        driverId: driver.id,
        latitude: new Prisma.Decimal(dto.latitude),
        longitude: new Prisma.Decimal(dto.longitude),
      },
    });
  }
}
