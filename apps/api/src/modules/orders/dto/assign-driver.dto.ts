import { IsUUID } from 'class-validator';

/**
 * تخصیص سفیر به سفارش — فقط ادمین مجاز است
 */
export class AssignDriverDto {
  /** شناسه سفیر (User مرتبط با پروفایل Driver) */
  @IsUUID('4')
  driverId!: string;
}
