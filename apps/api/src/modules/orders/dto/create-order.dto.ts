import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsPostalCode, NormalizePostalCode } from '../../../common/validators';

/**
 * آدرس سفارش — برای برداشت اجباری و برای تحویل اختیاری است.
 * در صورت خالی بودن آدرس تحویل، تحویل در آدرس برداخت انجام می‌شود.
 */
export class OrderAddressDto {
  @IsString()
  @IsNotEmpty()
  province!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @NormalizePostalCode()
  @IsPostalCode()
  postalCode!: string;

  @IsString()
  @IsNotEmpty()
  fullAddress!: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

/**
 * هر قلم خدمات سفارش — قیمت واحد از دیتابیس خوانده می‌شود،
 * بنابراین کلاینت آن را ارسال نمی‌کند.
 */
export class OrderItemDto {
  /** شناسه خدمت قالیشویی */
  @IsUUID('4')
  serviceId!: string;

  /** تعداد واحد — حداقل ۱ */
  @IsInt()
  @Min(1)
  quantity!: number;

  /** مساحت به متر مربع — برای خدمات بر اساس مساحت */
  @IsOptional()
  @IsNumber()
  @Min(0)
  areaSqm?: number;
}

/**
 * ثبت سفارش جدید — مشتری، آدرس برداشت و اقلام خدمات
 *
 * `idempotencyKey` برای جلوگیری از ثبت تکراری یک سفارش است:
 * ارسال دوبارهٔ همان کلید، سفارش قبلی را برمی‌گرداند.
 *
 * `laundryId` اختیاری است؛ اگر ارسال نشود، سفارش بدون کارگاه ثبت می‌شود
 * و ادمین بعداً با `assign-workshop` یک کارگاه به آن تخصیص می‌دهد.
 * در آن صورت قیمت‌گذاری پس از ارزیابی کارگاه انجام می‌شود.
 */
export class CreateOrderDto {
  /** کلید یکتای جلوگیری از ثبت تکراری — الزامی */
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  /** کارگاه مقصد — اختیاری؛ با ارسال نشدن، تخصیص دستی توسط ادمین لازم است */
  @IsOptional()
  @IsUUID('4')
  laundryId?: string;

  /** توضیحات اختیاری مشتری درباره سفارش */
  @IsOptional()
  @IsString()
  description?: string;

  /** بازه زمانی اختیاری برداشت */
  @IsOptional()
  @IsString()
  pickupTimeSlot?: string;

  /** آدرس محل برداشت فرش — اجباری */
  @ValidateNested()
  @Type(() => OrderAddressDto)
  pickupAddress!: OrderAddressDto;

  /** آدرس محل تحویل — اختیاری (پیش‌فرض: همان آدرس برداشت) */
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderAddressDto)
  deliveryAddress?: OrderAddressDto;

  /** اقلام سفارش — حداقل یک قلم الزامی است */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
