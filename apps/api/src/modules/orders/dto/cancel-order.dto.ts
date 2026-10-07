import { IsString } from 'class-validator';

/**
 * لغو سفارش توسط مشتری — فقط قبل از شروع شستشو مجاز است
 */
export class CancelOrderDto {
  /** دلیل لغو سفارش */
  @IsString()
  reason!: string;
}
