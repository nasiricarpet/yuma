import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * تخصیص دستی کارگاه به سفارش — فقط ادمین مجاز است.
 * اگر سفارش قبلاً کارگاه داشته باشد، جایگزین می‌شود.
 */
export class AssignWorkshopDto {
  /** شناسه قالیشویی (کارگاه) مقصد */
  @IsUUID('4')
  laundryId!: string;

  /** دلیل تخصیص دستی — در تاریخچه ثبت می‌شود */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  note?: string;
}
