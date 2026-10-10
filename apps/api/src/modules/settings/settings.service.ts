import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@yuma/db';
import { PrismaService } from '../../database/prisma.service';
import { ListSettingsDto } from './dto/list-settings.dto';

/**
 * سرویس تنظیمات سیستم — مقادیر پیکربندی پویا در دیتابیس
 *
 * تنظیمات با کلیدهای نقطه‌گذاری (مثل `brand.primaryColor`) ذخیره می‌شوند.
 * بخش `category` از همان بخش اول کلید گرفته می‌شود.
 */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** استخراج دسته‌بندی از کلید — `brand.primaryColor` → `brand` */
  static categoryOf(key: string): string {
    return key.split('.')[0]!;
  }

  /** لیست تمام تنظیمات با فیلتر اختیاری دسته — قدیمی‌ترین‌ها اول */
  async list(dto: ListSettingsDto) {
    const page = Math.max(1, dto.page ?? 1);
    const limit = Math.min(100, Math.max(1, dto.limit ?? 50));
    const skip = (page - 1) * limit;

    const where: Prisma.SettingWhereInput = {};
    if (dto.category) where.category = dto.category;
    if (dto.isPublic !== undefined) where.isPublic = dto.isPublic;

    const [items, total] = await Promise.all([
      this.prisma.setting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { key: 'asc' },
      }),
      this.prisma.setting.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * بروزرسانی مقدار یک تنظیم؛ اگر وجود نداشت ساخته می‌شود (upsert).
   *
   * @param key کلید تنظیم
   * @param value مقدار جدید (هر JSON معتبر)
   * @param actorId شناسه ادمینی که تغییر را انجام داده
   * @param isPublic عمومی بودن تنظیم (اختیاری)
   * @returns رکورد تنظیم پس از تغییر
   */
  async update(
    key: string,
    value: unknown,
    actorId: string,
    isPublic?: boolean,
  ) {
    const setting = await this.prisma.setting.upsert({
      where: { key },
      create: {
        key,
        value: value as Prisma.InputJsonValue,
        category: SettingsService.categoryOf(key),
        isPublic: isPublic ?? false,
        updatedById: actorId,
      },
      update: {
        value: value as Prisma.InputJsonValue,
        updatedById: actorId,
        ...(isPublic !== undefined ? { isPublic } : {}),
      },
    });

    this.logger.log(`تنظیم «${key}» توسط ${actorId} تغییر یافت`);

    return setting;
  }

  /**
   * تنظیمات عمومی — فقط آن‌هایی که `isPublic` هستند.
   *
   * هیچ احراز هویتی لازم ندارد؛ مقادیر حساس هرگز نباید `isPublic` باشند.
   */
  async getPublic() {
    const items = await this.prisma.setting.findMany({
      where: { isPublic: true },
      orderBy: { key: 'asc' },
    });

    // کلید → مقدار، برای استفاده‌ی ساده در کلاینت
    return items.reduce<Record<string, unknown>>((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
  }

  /** گرفتن مقدار یک تنظیم — در نبود تنظیم، استثنای ۴۰۴ */
  async getValue<T = unknown>(key: string): Promise<T> {
    const setting = await this.prisma.setting.findUnique({ where: { key } });

    if (!setting) {
      throw new NotFoundException(`تنظیم «${key}» وجود ندارد`);
    }

    return setting.value as T;
  }
}
