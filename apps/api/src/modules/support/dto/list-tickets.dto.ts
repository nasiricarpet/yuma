import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from './create-ticket.dto';

/** وضعیت تیکت — مقدارهای مجاز برای فیلتر لیست */
export const TICKET_STATUSES = [
  'open',
  'pending_agent',
  'resolved',
  'closed',
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

/**
 * فیلتر لیست تیکت‌ها — مسیر GET /tickets و GET /admin/support/tickets
 *
 * همه‌ی فیلترها اختیاری هستند. مشتری فقط تیکت‌های خودش را می‌بیند؛
 * فیلتر `assignedToId` فقط برای پشتیبان معنا دارد.
 */
export class ListTicketsDto {
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

  /** وضعیت تیکت */
  @IsOptional()
  @IsEnum(TICKET_STATUSES, { message: 'وضعیت نامعتبر است' })
  status?: TicketStatus;

  /** دسته‌بندی */
  @IsOptional()
  @IsEnum(TICKET_CATEGORIES, { message: 'دسته‌بندی نامعتبر است' })
  category?: string;

  /** اولویت */
  @IsOptional()
  @IsEnum(TICKET_PRIORITIES, { message: 'اولویت نامعتبر است' })
  priority?: string;

  /** فقط تیکت‌های تخصیص‌نیافته — فیلتر اختصاصی پشتیبان */
  @IsOptional()
  @IsIn(['true', 'false'], { message: 'مقدار باید true یا false باشد' })
  unassigned?: string;

  /** فقط تیکت‌های نقض‌شده‌ی SLA — فیلتر اختصاصی پشتیبان */
  @IsOptional()
  @IsIn(['true', 'false'], { message: 'مقدار باید true یا false باشد' })
  slaBreached?: string;

  /** جستجوی متنی در عنوان */
  @IsOptional()
  @IsString({ message: 'جستجو باید متن باشد' })
  search?: string;
}
