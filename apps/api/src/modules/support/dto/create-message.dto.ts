import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * بدنه‌ی ثبت پیام در تیکت — مسیر POST /tickets/:id/messages و
 * POST /admin/support/tickets/:id/messages
 *
 * پشتیبان می‌تواند پیام را داخلی (غیرقابل مشاهده برای مشتری) ثبت کند.
 */
export class CreateMessageDto {
  /** متن پیام — حداقل ۲ کاراکتر */
  @IsString({ message: 'متن پیام باید متن باشد' })
  @IsNotEmpty({ message: 'متن پیام الزامی است' })
  @MinLength(2, { message: 'متن پیام حداقل ۲ کاراکتر باشد' })
  @MaxLength(2_000, { message: 'متن پیام نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد' })
  body!: string;

  /** دیدمندی پیام — فقط پشتیبان می‌تواند internal ارسال کند */
  @IsOptional()
  @IsEnum(['public', 'internal'], { message: 'دیدمندی باید public یا internal باشد' })
  visibility?: 'public' | 'internal';
}
