import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/** اعتبار توکن دسترسی: ۱۵ دقیقه */
const ACCESS_TTL = '15m';
/** اعتبار توکن تمدید: ۳۰ روز */
const REFRESH_TTL = '30d';

/**
 * سرویس توکن — صدور توکن‌های JWT
 * توکن دسترس کوتاه‌مدت و توکن تمدید بلندمدت
 */
@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  /** توکن دسترسی — ۱۵ دقیقه — نقش کاربر برای کنترل دسترسی */
  generateAccessToken(userId: string, role: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId, role }, { expiresIn: ACCESS_TTL });
  }

  /** توکن تمدید — ۳۰ روز — شناسه نشت برای چرخش توکن */
  generateRefreshToken(userId: string, sessionId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId, sid: sessionId }, { expiresIn: REFRESH_TTL });
  }

  /** بررسی امضای توکن تمدید — در صورت نامعتبر بودن خطا پرتاب می‌شود */
  async verifyRefreshToken(token: string): Promise<JwtRefreshPayload> {
    return this.jwt.verifyAsync<JwtRefreshPayload>(token);
  }
}

/** بار توکن تمدید — شناسه نشست برابر id رکورد در refresh_tokens است */
export interface JwtRefreshPayload {
  /** شناسه کاربر */
  sub: string;
  /** شناسه رکورد توکن تمدید در دیتابیس */
  sid: string;
  /** زمان انقضای توکن */
  exp: number;
  /** زمان صدور توکن */
  iat: number;
}
