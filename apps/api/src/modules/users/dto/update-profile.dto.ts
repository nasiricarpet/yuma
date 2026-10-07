import { IsOptional } from 'class-validator';
import {
  IsNationalCode,
  IsPersianName,
  NormalizeNationalCode,
  NormalizePersianName,
} from '../../../common/validators';

/**
 * به‌روزرسانی پروفایل کاربر
 * هر دو فیلد اختیاری هستند — فقط مقادیر ارسال‌شده به‌روز می‌شوند
 */
export class UpdateProfileDto {
  /** نام و نام خانوادگی — فقط حروف فارسی */
  @IsOptional()
  @NormalizePersianName()
  @IsPersianName()
  fullName?: string;

  /** کد ملی — ۱۰ رقم با ارقام انگلیسی نرمال‌شده */
  @IsOptional()
  @NormalizeNationalCode()
  @IsNationalCode()
  nationalCode?: string;
}
