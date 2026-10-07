import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { faMessages } from '../../common/messages.fa';
import { UpdateLaundryDto } from './dto/update-laundry.dto';
import { CreateServiceDto } from './dto/create-service.dto';

/**
 * سرویس قالیشویی‌ها — مدیریت پروفایل و خدمات قالیشویی توسط مدیر خودش
 *
 * هر مدیر فقط به قالیشویی خودش (بر اساس ownerId) دسترسی دارد.
 * مالکیت در تمام متدها پیش از هر عملیاتی بررسی می‌شود.
 */
@Injectable()
export class LaundriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * پیدا کردن قالیشویی متعلق به این مدیر —
   * در صورت نبود NotFoundException پرتاب می‌شود
   */
  async getMyLaundry(ownerId: string) {
    const laundry = await this.prisma.laundry.findFirst({
      where: { ownerId },
    });

    if (!laundry) throw new NotFoundException(faMessages.laundry.notFound);

    return laundry;
  }

  /** آپدیت پروفایل قالیشویی — ابتدا مالکیت بررسی می‌شود */
  async updateMyLaundry(ownerId: string, dto: UpdateLaundryDto) {
    const laundry = await this.getMyLaundry(ownerId);

    // فیلدهای ارسال‌نشده (undefined) توسط Prisma تغییر نمی‌کنند
    return this.prisma.laundry.update({
      where: { id: laundry.id },
      data: {
        name: dto.name,
        city: dto.city,
        address: dto.address,
        phone: dto.phone,
      },
    });
  }

  /** افزودن خدمت جدید به قالیشویی این مدیر */
  async addService(ownerId: string, dto: CreateServiceDto) {
    const laundry = await this.getMyLaundry(ownerId);

    return this.prisma.laundryService.create({
      data: {
        laundryId: laundry.id,
        name: dto.name,
        unitPrice: dto.unitPrice,
        unit: dto.unit ?? 'count',
      },
    });
  }

  /** لیست خدمات قالیشویی این مدیر */
  async getServices(ownerId: string) {
    const laundry = await this.getMyLaundry(ownerId);

    return this.prisma.laundryService.findMany({
      where: { laundryId: laundry.id },
      orderBy: { name: 'asc' },
    });
  }
}
