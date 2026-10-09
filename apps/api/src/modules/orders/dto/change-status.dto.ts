import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ORDER_FLOW_LABELS, type OrderFlowStatus } from '@yuma/types';

/**
 * تغییر وضعیت سفارش — وضعیت جدید باید در جریان اصلی مجاز باشد.
 * برای انتقال‌هایی که `requiresNote` دارند، `note` اجباری است.
 */
export class ChangeStatusDto {
  /** وضعیت جدید — باید یکی از وضعیت‌های جریان اصلی باشد */
  @IsIn(Object.keys(ORDER_FLOW_LABELS))
  toStatus!: OrderFlowStatus;

  /** یادداشت درباره دلیل این تغییر وضعیت — برای برخی انتقال‌ها اجباری است */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  note?: string;
}
