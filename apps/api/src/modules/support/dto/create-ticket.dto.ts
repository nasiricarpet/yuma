import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** دسته‌بندی تیکت — مقدارهای مجاز برای کلاینت */
export const TICKET_CATEGORIES = [
  'order_issue',
  'payment_issue',
  'delivery_issue',
  'quality_issue',
  'account_issue',
  'other',
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

/** اولویت تیکت — مشتری می‌تواند فوریت را تعیین کند */
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

/**
 * بدنه‌ی ثبت تیکت پشتیبانی — مسیر POST /tickets
 *
 * فقط مشتری می‌تواند تیکت ثبت کند. مهلت پاسخ اولیه (SLA) بر اساس
 * `priority` توسط سرویس محاسبه می‌شود.
 */
export class CreateTicketDto {
  /** عنوان کوتاه مشکل — حداقل ۵ کاراکتر */
  @IsString({ message: 'عنوان باید متن باشد' })
  @IsNotEmpty({ message: 'عنوان الزامی است' })
  @MinLength(5, { message: 'عنوان حداقل ۵ کاراکتر باشد' })
  @MaxLength(120, { message: 'عنوان نمی‌تواند بیشتر از ۱۲۰ کاراکتر باشد' })
  subject!: string;

  /** دسته‌بندی مشکل */
  @IsEnum(TICKET_CATEGORIES, { message: 'دسته‌بندی نامعتبر است' })
  category!: TicketCategory;

  /** اولویت — پیش‌فرض medium است */
  @IsOptional()
  @IsEnum(TICKET_PRIORITIES, { message: 'اولویت نامعتبر است' })
  priority?: TicketPriority;

  /** سفارش مرتبط — اختیاری؛ فقط در صورت وجود بررسی می‌شود */
  @IsOptional()
  @IsString({ message: 'شناسه سفارش باید متن باشد' })
  orderId?: string;

  /** متن اولین پیام تیکت — حداقل ۱۰ کاراکتر */
  @IsString({ message: 'متن پیام باید متن باشد' })
  @IsNotEmpty({ message: 'متن پیام الزامی است' })
  @MinLength(10, { message: 'متن پیام حداقل ۱۰ کاراکتر باشد' })
  @MaxLength(2_000, { message: 'متن پیام نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد' })
  body!: string;
}
