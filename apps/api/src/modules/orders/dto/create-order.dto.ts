import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsPostalCode, NormalizePostalCode } from '../../../common/validators';

/** آدرس برداشتی سفارش — مشتری هنگام ثبت، مقصد را مشخص می‌کند */
export class OrderAddressDto {
  @IsString()
  province!: string;

  @IsString()
  city!: string;

  @NormalizePostalCode()
  @IsPostalCode()
  postalCode!: string;

  @IsString()
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
 * بنابراین کلاینت آن را ارسال نمی‌کند
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
 * ثبت سفارش جدید — مشتری، قالیشویی، آدرس برداشتی و اقلام خدمات
 *
 * توجه: `customerId` فعلاً به‌صورت فرضی در بدنه درخواست دریافت می‌شود و
 * در مرحله بعدی از توکن JWT استخراج خواهد شد.
 */
export class CreateOrderDto {
  /** مشتری سفارش — موقتاً در بدنه، بعداً از توکن */
  @IsUUID('4')
  customerId!: string;

  /** قالیشویی مقصد سفارش */
  @IsUUID('4')
  laundryId!: string;

  /** توضیحات اختیاری مشتری درباره سفارش */
  @IsOptional()
  @IsString()
  description?: string;

  /** بازه زمانی اختیاری برداشتی */
  @IsOptional()
  @IsString()
  pickupTimeSlot?: string;

  /** آدرس محل برداشت فرش */
  @ValidateNested()
  @Type(() => OrderAddressDto)
  address!: OrderAddressDto;

  /** اقلام سفارش — حداقل یک قلم الزامی است */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
