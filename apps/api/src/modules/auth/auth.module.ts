import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuditModule } from '../audit-log/audit.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * ماژول احراز هویت — OTP، توکن، نشست و گاردها
 * گارد JWT به صورت سراسری ثبت می‌شود و مسیرهای @Public از آن مستثنی هستند
 */
@Module({
  imports: [
    // AuditModule برای ثبت رویدادهای ورود و خروج در ممیزی
    AuditModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    OtpService,
    TokenService,
    SessionService,
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      // گارد نقش‌ها بعد از گارد JWT اجرا می‌شود — مسیرهای @Roles() را محدود می‌کند
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [OtpService, TokenService, SessionService, AuthService],
})
export class AuthModule {}
