import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from '@yuma/db';
import { normalizeMobile } from '@yuma/validators';
import {
  IsNationalCode,
  IsPersianName,
  NormalizeNationalCode,
  NormalizePersianName,
} from '../../../common/validators';

/**
 * ساخت کاربر جدید توسط ادمین — مسیر POST /admin/users
 *
 * رمز عبور اختیاری است: اگر ارسال شود با bcrypt هش و ذخیره می‌شود،
 * وگرنه `passwordHash` خالی می‌ماند و کاربر از طریق OTP وارد می‌شود.
 */
export class CreateUserDto {
  /** شماره موبایل — نرمال‌شده به فرمت 09xxxxxxxxx */
  @Transform(({ value }) => normalizeMobile(String(value)))
  @IsString({ message: 'شماره موبایل باید متن باشد' })
  @Matches(/^09\d{9}$/, {
    message: 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود',
  })
  mobile!: string;

  /** نام و نام خانوادگی */
  @NormalizePersianName()
  @IsPersianName({ message: 'نام باید فقط شامل حروف فارسی باشد (۲ تا ۶۰ کاراکتر)' })
  @IsString({ message: 'نام و نام خانوادگی باید متن باشد' })
  @IsNotEmpty({ message: 'نام و نام خانوادگی الزامی است' })
  fullName!: string;

  /** نقش کاربر — یکی از مقادیر مجاز enum */
  @IsEnum(UserRole, { message: 'نقش انتخاب‌شده نامعتبر است' })
  role!: UserRole;

  /** کد ملی — اختیاری */
  @IsOptional()
  @NormalizeNationalCode()
  @IsNationalCode({ message: 'کد ملی نامعتبر است' })
  nationalCode?: string;

  /** ایمیل — اختیاری */
  @IsOptional()
  @IsEmail({}, { message: 'ایمیل نامعتبر است' })
  email?: string;

  /** رمز عبور اولیه — اختیاری؛ هنگام ارسال با bcrypt هش می‌شود */
  @IsOptional()
  @IsString({ message: 'رمز عبور باید متن باشد' })
  @MinLength(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' })
  password?: string;
}
