import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AUDIT_ACTIONS } from '../audit.service';

/**
 * فیلتر لیست رویدادهای ممیزی — مسیر GET /admin/audit-log
 *
 * همه‌ی فیلترها اختیاری هستند. `from`/`to` بازه‌ی زمانی
 * رویدادها را بر اساس زمان ثبت محدود می‌کنند.
 */
export class ListAuditDto {
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

  /** شناسه کاربری که عمل را انجام داده */
  @IsOptional()
  @IsString({ message: 'شناسه کاربر باید متن باشد' })
  actorId?: string;

  /** نوع عمل — یکی از create | update | delete | change-role | login | logout | status-change | cancel */
  @IsOptional()
  @IsIn([...AUDIT_ACTIONS], { message: 'نوع عمل نامعتبر است' })
  action?: string;

  /** نوع موجودیت — مثلاً order */
  @IsOptional()
  @IsString({ message: 'نوع موجودیت باید متن باشد' })
  entityType?: string;

  /** شناسه موجودیت هدف */
  @IsOptional()
  @IsString({ message: 'شناسه موجودیت باید متن باشد' })
  entityId?: string;

  /** شروع بازه‌ی زمانی (شارع ISO ۸۶۰۱) */
  @IsOptional()
  @IsDateString({}, { message: 'تاریخ شروع نامعتبر است' })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  from?: Date;

  /** پایان بازه‌ی زمانی (شارع ISO ۸۶۰۱) */
  @IsOptional()
  @IsDateString({}, { message: 'تاریخ پایان نامعتبر است' })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  to?: Date;
}
