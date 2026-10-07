import { IsOptional, IsString } from 'class-validator';

/**
 * ویرایش پروفایل قالیشویی — همه فیلدها اختیاری هستند
 */
export class UpdateLaundryDto {
  /** نام قالیشویی */
  @IsOptional()
  @IsString()
  name?: string;

  /** شهر محل قالیشویی */
  @IsOptional()
  @IsString()
  city?: string;

  /** آدرس کامل قالیشویی */
  @IsOptional()
  @IsString()
  address?: string;

  /** شماره تماس قالیشویی */
  @IsOptional()
  @IsString()
  phone?: string;
}
