import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from '@yuma/db';
import {
  IsNationalCode,
  IsPersianName,
  NormalizeNationalCode,
  NormalizePersianName,
} from '../../../common/validators';

/**
 * ویرایش کاربر توسط ادمین — مسیر PATCH /admin/users/:id
 *
 * همه‌ی فیلدها اختیاری هستند و فقط فیلدهای ارسال‌شده تغییر می‌کنند.
 * نقش از این مسیر هم قابل تغییر است، اما ادمین نمی‌تواند نقش
 * حساب خودش را تغییر دهد (مسیر /role مختص تغییر نقش است).
 */
export class UpdateUserDto {
  /** نام و نام خانوادگی */
  @IsOptional()
  @NormalizePersianName()
  @IsPersianName({ message: 'نام باید فقط شامل حروف فارسی باشد (۲ تا ۶۰ کاراکتر)' })
  @IsString({ message: 'نام و نام خانوادگی باید متن باشد' })
  fullName?: string;

  /** کد ملی */
  @IsOptional()
  @NormalizeNationalCode()
  @IsNationalCode({ message: 'کد ملی نامعتبر است' })
  nationalCode?: string;

  /** ایمیل */
  @IsOptional()
  @IsEmail({}, { message: 'ایمیل نامعتبر است' })
  email?: string;

  /** وضعیت حساب کاربری */
  @IsOptional()
  @IsBoolean({ message: 'وضعیت باید true یا false باشد' })
  isActive?: boolean;

  /**
   * نقش کاربر — ادمین نمی‌تواند نقش حساب خودش را از این مسیر تغییر دهد
   * (برای جلوگیری از خطای لاک‌اوت)
   */
  @IsOptional()
  @IsEnum(UserRole, { message: 'نقش انتخاب‌شده نامعتبر است' })
  role?: UserRole;
}
