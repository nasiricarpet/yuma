import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

/**
 * فیلتر لیست تسویه‌ها — مسیر GET /admin/settlements
 *
 * همه‌ی فیلترها اختیاری هستند. `month` دوره را به فرمت YYYY-MM محدود می‌کند.
 */
export class ListSettlementsDto {
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

  /** شناسه کارگاه — محدود کردن لیست به یک کارگاه */
  @IsOptional()
  @IsString({ message: 'شناسه کارگاه باید متن باشد' })
  workshopId?: string;

  /** وضعیت تسویه: pending | paid */
  @IsOptional()
  @IsIn(['pending', 'paid'], { message: 'وضعیت باید pending یا paid باشد' })
  status?: string;

  /** دوره به فرمت میلادی YYYY-MM — مثلاً 2026-09 */
  @IsOptional()
  @IsString({ message: 'دوره باید متن باشد' })
  @Matches(/^\d{4}-\d{2}$/, { message: 'دوره باید به فرمت YYYY-MM باشد' })
  month?: string;
}
