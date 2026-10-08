import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { UserRole } from '@yuma/db';

/**
 * لیست کاربران در پنل ادمین — صفحه‌بندی + فیلتر وضعیت/نقش و جستجو
 *
 * جستجو روی نام، شماره موبایل و کد ملی اعمال می‌شود.
 */
export class AdminListUsersDto {
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
  limit?: number = 20;

  /** عبارت جستجو — نام، موبایل یا کد ملی */
  @IsOptional()
  @IsString()
  search?: string;

  /** فیلتر بر اساس نقش کاربر */
  @IsOptional()
  @IsString()
  role?: UserRole;

  /**
   * فیلتر بر اساس وضعیت حساب: true = فعال، false = غیرفعال
   *
   * توجه: نمی‌توانیم از `@Type(() => Boolean)` استفاده کنیم، چون رشته‌ی
   * `"false"` را به `Boolean("false")` یعنی `true` تبدیل می‌کند و ادمین
   * به‌جای غیرفعال‌ها، فهرست فعال‌ها را می‌بیند. فقط همین سه مقدار معتبر
   * تبدیل می‌شوند و هر چیز دیگر توسط `@IsBoolean` رد می‌شود.
   */
  @IsOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === '1'
        ? true
        : value === false || value === 'false' || value === '0'
          ? false
          : value,
    { toClassOnly: true },
  )
  @IsBoolean({ message: 'وضعیت باید true یا false باشد' })
  isActive?: boolean;
}
