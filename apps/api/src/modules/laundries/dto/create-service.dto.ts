import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

/** واحدهای شمارش مجاز برای خدمات قالیشویی — عدد، متر مربع، کیلوگرم */
const SERVICE_UNITS = ['count', 'sqm', 'kg'] as readonly string[];

/**
 * ثبت خدمت جدید برای قالیشویی — قیمت‌ها به ریال (IRR) ذخیره می‌شوند
 */
export class CreateServiceDto {
  /** نام خدمت — مثلاً شستشوی دستباف یا لکه‌گیری */
  @IsString()
  name!: string;

  /** قیمت واحد به ریال */
  @IsInt()
  @Min(0)
  unitPrice!: number;

  /** واحد شمارش — پیش‌فرض count */
  @IsOptional()
  @IsIn(SERVICE_UNITS)
  unit?: string;
}
