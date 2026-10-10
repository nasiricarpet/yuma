import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { faMessages } from '../../common/messages.fa';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import type { JwtRefreshPayload } from './services/token.service';
import { SessionService } from './services/session.service';
import type { RefreshToken } from '@yuma/db';

/** اعتبار توکن تمدید: ۳۰ روز — بر حسب میلی‌ثانیه */
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** خروجی مشترک مسیرهای احراز هویت — جفت توکن‌ها */
export interface AuthResult {
  /** توکن دسترسی کوتاه‌مدت */
  accessToken: string;
  /** توکن تمدید بلندمدت */
  refreshToken: string;
}

/**
 * خروجی مسیر ورود — توکن‌ها به اضافه‌ی شناسه و نقش کاربری که
 * همین حالا احراز هویت شده (برای ثبت رویداد ممیزی ورود).
 */
export interface VerifyResult extends AuthResult {
  userId: string;
  role: string;
}

/**
 * سرویس احراز هویت — تجمیع منطق OTP، توکن و نشست
 * توکن تمدید به صورت هش‌شده در دیتابیس نگهداری و در هر بار استفاده چرخش می‌کند
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly prisma: PrismaService,
  ) {}

  /** تأیید کد یک‌بار مصرف و صدور توکن — کاربر جدید با نقش پیش‌فرض customer ساخته می‌شود */
  async verifyOtp(mobile: string, code: string): Promise<VerifyResult> {
    await this.otpService.verify(mobile, code);

    const user = await this.prisma.user.upsert({
      where: { mobile },
      update: {},
      create: { mobile, fullName: '', passwordHash: '', role: 'customer' },
    });

    const tokens = await this.issueTokens(user.id, user.role);
    return { ...tokens, userId: user.id, role: user.role };
  }

  /** چرخش توکن — توکن قدیمی ابطال و جفت توکن جدید صادر می‌شود */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    const payload = await this.verifyRefreshTokenOrThrow(refreshToken);

    const stored = await this.findActiveToken(payload.sub, refreshToken);

    // شناسه نشست در توکن باید با رکورد دیتابیس یکی باشد
    if (stored.id !== payload.sid) {
      throw new UnauthorizedException(faMessages.common.unauthorized);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      select: { role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(faMessages.common.unauthorized);
    }

    // توکن مصرف‌شده ابطال و جفت جدید صادر می‌شود
    await this.sessionService.revoke(stored.id);

    return this.issueTokens(stored.userId, user.role);
  }

  /** خروج — ابطال توکن تمدید؛ حتی با توکن نامعتبر هم موفق است */
  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      const stored = await this.findActiveToken(payload.sub, refreshToken);
      if (stored) await this.sessionService.revoke(stored.id);
    } catch {
      // خروج نباید با خطا رد شود — توکن نامعتبر هم انگار ابطال شده است
    }
  }

  /** صدور جفت توکن و ثبت نشست در دیتابیس */
  private async issueTokens(userId: string, role: string): Promise<AuthResult> {
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    // رکورد نشست با هش موقت ساخته می‌شود تا شناسه آن در توکن تمدید قرار گیرد
    const session = await this.sessionService.create(userId, randomUUID(), expiresAt);

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.generateAccessToken(userId, role),
      this.tokenService.generateRefreshToken(userId, session.id),
    ]);

    // هش توکن نهایی جایگزین هش موقت می‌شود
    const tokenHash = await this.sessionService.hashToken(refreshToken);
    await this.sessionService.updateHash(session.id, tokenHash);

    return { accessToken, refreshToken };
  }

  /** بررسی امضای توکن تمدید — در صورت نامعتبری خطای ۴۰۱ */
  private async verifyRefreshTokenOrThrow(token: string): Promise<JwtRefreshPayload> {
    try {
      return await this.tokenService.verifyRefreshToken(token);
    } catch {
      throw new UnauthorizedException(faMessages.auth.tokenExpired);
    }
  }

  /** پیدا کردن رکورد توکن فعال که با توکن خام دریافتی تطابق دارد */
  private async findActiveToken(userId: string, refreshToken: string): Promise<RefreshToken> {
    const candidates = await this.sessionService.findActiveByUser(userId);

    for (const candidate of candidates) {
      // هش bcrypt قابل جستجوی مستقیم نیست — تک‌تک توکن‌های فعال مقایسه می‌شوند
      if (await this.sessionService.verifyToken(refreshToken, candidate.tokenHash)) {
        return candidate;
      }
    }

    throw new UnauthorizedException(faMessages.auth.tokenExpired);
  }
}
