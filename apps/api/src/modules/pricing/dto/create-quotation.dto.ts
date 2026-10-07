import { IsInt, Min } from 'class-validator';

/**
 * ثبت پیش‌فاکتور (Quotation) توسط کارگاه
 *
 * تمام مبالغ به ریال (IRR) و عدد صحیح هستند.
 * کارگرهای ارسالی: subtotalAmount، deliveryFee و taxAmount.
 */
export class CreateQuotationDto {
  /** جمع اقلام سفارش (ریال) */
  @IsInt()
  @Min(0)
  subtotalAmount!: number;

  /** هزینه حمل‌ونقل (ریال) — پیش‌فرض صفر است ولی اینجا اجباری ارسال می‌شود */
  @IsInt()
  @Min(0)
  deliveryFee!: number;

  /** مالیات (ریال) — پیش‌فرض صفر است ولی اینجا اجباری ارسال می‌شود */
  @IsInt()
  @Min(0)
  taxAmount!: number;
}
