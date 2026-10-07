import { IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeMobile } from '@yuma/validators';

/** بررسی کد تأیید — موبایل و کد ۶ رقمی */
export class VerifyOtpDto {
  @Transform(({ value }) => normalizeMobile(String(value)))
  @IsString()
  @Matches(/^09\d{9}$/)
  mobile!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}
