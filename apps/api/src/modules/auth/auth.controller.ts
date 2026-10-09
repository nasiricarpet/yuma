import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import type { AuthResult } from './auth.service';
import { OtpService } from './services/otp.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

/**
 * کنترلر احراز هویت — ورود با کد یک‌بار مصرف موبایل
 * مسیرهای otp/verify، otp/request و refresh عمومی هستند؛ logout و me محافظت‌شده
 */
@ApiTags('احراز هویت')
@Controller()
export class AuthController {
  constructor(
    private readonly otpService: OtpService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('otp/request')
  @ApiOperation({ summary: 'ارسال کد تأیید به موبایل' })
  async request(
    @Body() dto: RequestOtpDto,
  ): Promise<{ ok: true; mobile: string; devCode?: string }> {
    const { devCode } = await this.otpService.request(dto.mobile);

    // در محیط توسعه کد برای تست دستی در response قرار می‌گیرد؛
    // در production سرویس کدی برنمی‌گرداند و این فیلد پر نمی‌شود
    if (process.env.NODE_ENV !== 'production' && devCode) {
      return { ok: true, mobile: dto.mobile, devCode };
    }

    return { ok: true, mobile: dto.mobile };
  }

  @Public()
  @Post('otp/verify')
  @ApiOperation({ summary: 'بررسی کد تأیید و صدور توکن' })
  async verify(@Body() dto: VerifyOtpDto): Promise<{ ok: true } & AuthResult> {
    const tokens = await this.authService.verifyOtp(dto.mobile, dto.code);
    return { ok: true, ...tokens };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'تمدید توکن دسترسی با توکن تمدید' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<{ ok: true } & AuthResult> {
    const tokens = await this.authService.refreshToken(dto.refreshToken);
    return { ok: true, ...tokens };
  }

  @Post('logout')
  @ApiOperation({ summary: 'ابطال توکن تمدید و پایان جلسه' })
  async logout(@Body() dto: RefreshTokenDto): Promise<{ ok: true }> {
    await this.authService.logout(dto.refreshToken);
    return { ok: true };
  }

  @Get('me')
  @ApiOperation({ summary: 'اطلاعات کاربر احراز هویت‌شده' })
  async me(
    @CurrentUser() user: AuthUser,
  ): Promise<{ ok: true; id: string; mobile: string; role: string }> {
    return { ok: true, id: user.id, mobile: user.mobile, role: user.role };
  }
}
