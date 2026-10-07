import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service';

/**
 * استراتژی JWT — توکن دسترسی را از هدر Authorization بررسی می‌کند
 * بار توکن دسترسی: { sub: userId, role }
 */
export interface JwtAccessPayload {
  /** شناسه کاربر */
  sub: string;
  /** نقش کاربر */
  role: string;
}

/**
 * شیء کاربر که روی req.user قرار می‌گیرد
 */
export interface JwtAuthUser {
  id: string;
  mobile: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') as string,
    });
  }

  /** پس از تأیید امضا، کاربر بارگذاری و بررسی فعال‌بودن می‌شود */
  async validate(payload: JwtAccessPayload): Promise<JwtAuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, mobile: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return { id: user.id, mobile: user.mobile, role: user.role };
  }
}
