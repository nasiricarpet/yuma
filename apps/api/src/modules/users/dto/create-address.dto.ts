import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { IsPostalCode, NormalizePostalCode } from '../../../common/validators';

/**
 * ثبت آدرس جدید در دفترچه آدرس کاربر
 */
export class CreateAddressDto {
  /** عنوان آدرس — خانه، محل کار و... */
  @IsString()
  @IsNotEmpty()
  title!: string;

  /** استان */
  @IsString()
  @IsNotEmpty()
  province!: string;

  /** شهر */
  @IsString()
  @IsNotEmpty()
  city!: string;

  /** آدرس کامل */
  @IsString()
  @IsNotEmpty()
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
