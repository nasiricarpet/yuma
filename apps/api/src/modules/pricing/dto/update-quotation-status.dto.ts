import { IsIn, IsString } from 'class-validator';

/**
 * تغییر وضعیت پیش‌فاکتور (Quotation)
 *
 * وضعیت‌های مجاز: draft (پیش‌نویس)، sent (ارسال‌شده)،
 * approved (تأییدشده توسط مشتری) و rejected (ردشده).
 */
export class UpdateQuotationStatusDto {
  /** وضعیت جدید پیش‌فاکتور */
  @IsString()
  @IsIn(['draft', 'sent', 'approved', 'rejected'])
  status!: string;
}
