import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { RefreshToken } from '@yuma/db';

/**
 * سرویس نشست — پایداری توکن‌های تمدید در دیتابیس
 * توکن قبل از ذخیره با bcrypt هش می‌شود
 */
@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /** هش کردن توکن با bcrypt پیش از ذخیره در دیتابیس */
  async hashToken(token: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(token, 10);
  }

  /** مقایعه توکن خام با هش ذخیره‌شده */
  async verifyToken(token: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(token, hash);
  }

  /** ثبت توکن تمدید جدید برای یک کاربر */
  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  /** توکن فعال — ابطال‌نشده و هنوز منقضی‌نشده */
  async findActive(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /** ابطال یک توکن با ثبت زمان ابطال */
  async revoke(tokenId: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  /** همه توکن‌های فعال یک کاربر — هش توکن برای مقایسه با bcrypt نیاز است */
  async findActiveByUser(userId: string): Promise<RefreshToken[]> {
    return this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  /** به‌روزرسانی هش توکن — پس از صدور توکن نهایی روی رکورد موقت */
  async updateHash(tokenId: string, tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { tokenHash },
    });
  }

  /** ابطال همه توکن‌های فعال یک کاربر — برای تغییر رمز یا خروج کامل */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
