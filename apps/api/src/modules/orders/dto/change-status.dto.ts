import { IsIn, IsOptional, IsString } from 'class-validator';
import { ORDER_STATUS_LABELS, OrderStatus } from '@yuma/types';

/**
 * تغییر وضعیت سفارش توسط سفیر یا کارگاه
 */
export class ChangeStatusDto {
  /** وضعیت جدید — باید یکی از وضعیت‌های معتبر سفارش باشد */
  @IsIn(Object.keys(ORDER_STATUS_LABELS))
  toStatus!: OrderStatus;

  /** یادداشت اختیاری درباره دلیل این تغییر وضعیت */
  @IsOptional()
  @IsString()
  note?: string;
}
