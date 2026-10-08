import { IsEmail, IsOptional } from 'class-validator';
import {
  IsNationalCode,
  IsPersianName,
  NormalizeNationalCode,
  NormalizePersianName,
} from '../../../common/validators';

/**
 * به‌روزرسانی پروفایل کاربر
 * هر سه فیلد اختیاری هستند — فقط مقادیر ارسال‌شده به‌روز می‌شوند
 */
export class UpdateProfileDto {
  /** نام و نام خانوادگی — فقط حروف فارسی */
  @IsOptional()
  @NormalizePersianName()
  @IsPersianName()
  fullName?: string;

  /** ایمیل — اختیاری، در صورت ارسال باید معتبر باشد */
  @IsOptional()
  @IsEmail({}, { message: 'ایمیل واردشده معتبر نیست' })
  email?: string;

  /** کد ملی — ۱۰ رقم با ارقام انگلیسی نرمال‌شده و دارای رقم کنترل معتبر */
  @IsOptional()
  @NormalizeNationalCode()
  @IsNationalCode()
  nationalCode?: string;
}
