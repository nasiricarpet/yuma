import { IsNotEmpty, IsString } from 'class-validator';

/**
 * لغو سفارش — توسط مشتری (فقط سفارش خودش) یا ادمین (هر سفارشی).
 * دلیل لغو همیشه اجباری است و در تاریخچه ثبت می‌شود.
 */
export class CancelOrderDto {
  /** دلیل لغو سفارش */
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
