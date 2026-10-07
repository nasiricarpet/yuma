import { IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeMobile } from '@yuma/validators';

/** درخواست کد تأیید — فقط موبایل */
export class RequestOtpDto {
  @Transform(({ value }) => normalizeMobile(String(value)))
  @IsString()
  @Matches(/^09\d{9}$/)
  mobile!: string;
}
