import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ORDER_FLOW_LABELS, type OrderFlowStatus } from '@yuma/types';

/**
 * فیلتر پیشرفته لیست سفارش‌های ادمین —
 * ترکیب وضعیت، بازه تاریخ، کارگاه، سفیر، مشتری و جستجوی آزاد.
 *
 * جستجو روی کد پیگیری و نام کامل مشتری انجام می‌شود.
 * نتیجه بر اساس `createdAt` نزولی (جدیدترین اول) مرتب می‌شود.
 */
export class AdminListOrdersDto {
  /** فیلتر بر اساس وضعیت سفارش */
  @IsOptional()
  @IsString()
  @IsIn(Object.keys(ORDER_FLOW_LABELS))
  status?: OrderFlowStatus;

  /** شروع بازه تاریخ — بر اساس زمان ثبت سفارش */
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  /** پایان بازه تاریخ — بر اساس زمان ثبت سفارش */
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  /** فیلتر بر اساس کارگاه */
  @IsOptional()
  @IsUUID('4')
  laundryId?: string;

  /** فیلتر بر اساس سفیر */
  @IsOptional()
  @IsUUID('4')
  driverId?: string;

  /** فیلتر بر اساس مشتری */
  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  /** جستجوی آزاد در کد پیگیری و نام مشتری */
  @IsOptional()
  @IsString()
  search?: string;

  /** شماره صفحه — پیش‌فرض ۱ */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** تعداد آیتم در هر صفحه — پیش‌فرض ۲۰، حداکثر ۱۰۰ */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
