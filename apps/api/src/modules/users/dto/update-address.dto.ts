import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsPostalCode, NormalizePostalCode } from '../../../common/validators';

/**
 * ویرایش آدرس موجود — همه فیلدها اختیاری هستند
 *
 * اعتبارسنجی‌ها دقیقاً مثل CreateAddressDto است، با این تفاوت که
 * هیچ فیلدی الزامی نیست؛ فقط فیلدهای ارسال‌شده به‌روز می‌شوند.
 */
export class UpdateAddressDto {
  /** عنوان آدرس — خانه، محل کار و... */
  @IsOptional()
  @IsString({ message: 'عنوان آدرس باید متن باشد' })
  @IsNotEmpty({ message: 'عنوان آدرس نمی‌تواند خالی باشد' })
  title?: string;

  /** استان */
  @IsOptional()
  @IsString({ message: 'استان باید متن باشد' })
  @IsNotEmpty({ message: 'استان نمی‌تواند خالی باشد' })
  province?: string;

  /** شهر */
  @IsOptional()
  @IsString({ message: 'شهر باید متن باشد' })
  @IsNotEmpty({ message: 'شهر نمی‌تواند خالی باشد' })
  city?: string;

  /** آدرس کامل */
  @IsOptional()
  @IsString({ message: 'آدرس کامل باید متن باشد' })
  @IsNotEmpty({ message: 'آدرس کامل نمی‌تواند خالی باشد' })
  fullAddress?: string;

  /** کد پستی — ۱۰ رقم با ارقام انگلیسی نرمال‌شده */
  @IsOptional()
  @NormalizePostalCode()
  @IsPostalCode()
  postalCode?: string;

  /** عرض جغرافیایی — اختیاری */
  @IsOptional()
  @IsNumber()
  lat?: number;

  /** طول جغرافیایی — اختیاری */
  @IsOptional()
  @IsNumber()
  lng?: number;
}
