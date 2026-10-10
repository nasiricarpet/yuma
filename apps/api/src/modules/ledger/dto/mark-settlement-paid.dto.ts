import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * بدنه‌ی علامت‌گذاری تسویه به‌عنوان پرداخت‌شده — مسیر POST /admin/settlements/:id/mark-paid
 */
export class MarkSettlementPaidDto {
  /** مرجع پرداخت بانکی — شناسه‌ی حواله یا شماره فیش. اختیاری است */
  @IsOptional()
  @IsString({ message: 'مرجع پرداخت باید متن باشد' })
  @MaxLength(100, { message: 'مرجع پرداخت نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد' })
  reference?: string;
}
