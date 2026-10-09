import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * تخصیص دستی سفیر به سفارش — فقط ادمین مجاز است.
 * یک وظیفه (Assignment) با فاز pickup برای سفیر ساخته می‌شود.
 */
export class AssignDriverDto {
  /** شناسه سفیر (User مرتبط با پروفایل Driver) */
  @IsUUID('4')
  driverId!: string;

  /** دلیل تخصیص دستی — در تاریخچه ثبت می‌شود */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  note?: string;
}
