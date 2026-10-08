import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { IsPostalCode, NormalizePostalCode } from '../../../common/validators';

/**
 * ثبت آدرس جدید در دفترچه آدرس کاربر
 */
export class CreateAddressDto {
  /** عنوان آدرس — خانه، محل کار و... */
  @IsString({ message: 'عنوان آدرس باید متن باشد' })
  @IsNotEmpty({ message: 'عنوان آدرس الزامی است' })
  title!: string;

  /** استان */
  @IsString({ message: 'استان باید متن باشد' })
  @IsNotEmpty({ message: 'استان الزامی است' })
  province!: string;

  /** شهر */
  @IsString({ message: 'شهر باید متن باشد' })
  @IsNotEmpty({ message: 'شهر الزامی است' })
  city!: string;

  /** آدرس کامل */
  @IsString({ message: 'آدرس کامل باید متن باشد' })
  @IsNotEmpty({ message: 'آدرس کامل الزامی است' })
  fullAddress!: string;

  /** کد پستی — ۱۰ رقم با ارقام انگلیسی نرمال‌شده */
  @NormalizePostalCode()
  @IsPostalCode()
  postalCode!: string;

  /** عرض جغرافیایی — اختیاری */
  @IsOptional()
  @IsNumber()
  lat?: number;

  /** طول جغرافیایی — اختیاری */
  @IsOptional()
  @IsNumber()
  lng?: number;
}
