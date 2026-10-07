import { IsString } from 'class-validator';

/** درخواست تمدید یا خروج — توکن تمدید دریافتی از کلاینت */
export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}
