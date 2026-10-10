import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * فیلتر لیست تنظیمات — مسیر GET /admin/settings
 *
 * همه‌ی فیلترها اختیاری هستند.
 */
export class ListSettingsDto {
  /** شماره صفحه — از ۱ شروع می‌شود */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'صفحه باید عدد باشد' })
  @Min(1, { message: 'کوچکترین شماره صفحه ۱ است' })
  page?: number = 1;

  /** تعداد آیتم در هر صفحه */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'تعداد باید عدد باشد' })
  @Min(1, { message: 'حداقل تعداد در هر صفحه ۱ است' })
  @Max(100, { message: 'حداکثر تعداد در هر صفحه ۱۰۰ است' })
  limit?: number = 50;

  /** دسته‌بندی: brand, contact, payment, order, sms, features */
  @IsOptional()
  @IsString({ message: 'دسته‌بندی باید متن باشد' })
  category?: string;

  /** محدود کردن به تنظیمات عمومی یا غیرعمومی */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  @IsBoolean({ message: 'isPublic باید true یا false باشد' })
  isPublic?: boolean;
}
