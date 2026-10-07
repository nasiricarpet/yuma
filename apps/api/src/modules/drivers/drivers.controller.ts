import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { DriversService } from './drivers.service';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { LogLocationDto } from './dto/log-location.dto';

/**
 * کنترلر سفیران — پروفایل، دسترسی‌پذیری و موقعیت لحظه‌ای
 *
 * تمام مسیرها فقط برای نقش driver قابل دسترسی هستند.
 * گارد JWT و RolesGuard به صورت سراسری ثبت شده‌اند و
 * شناسه سفیر از طریق @CurrentUser() استخراج می‌شود.
 */
@ApiTags('سفیران')
@Controller('driver')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get('profile')
  @ApiOperation({ summary: 'دریافت پروفایل سفیر لاگین‌شده' })
  @Roles('driver')
  async getProfile(@CurrentUser() user: AuthUser) {
    const driver = await this.driversService.getMyProfile(user.id);
    return { ok: true, driver };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'بروزرسانی پروفایل سفیر' })
  @Roles('driver')
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateDriverDto,
  ) {
    const driver = await this.driversService.updateMyProfile(user.id, dto);
    return { ok: true, driver };
  }

  @Patch('availability')
  @ApiOperation({ summary: 'تغییر وضعیت آنلاین/آفلاین سفیر' })
  @Roles('driver')
  async toggleAvailability(@CurrentUser() user: AuthUser) {
    const driver = await this.driversService.toggleAvailability(user.id);
    return { ok: true, driver };
  }

  @Post('location')
  @ApiOperation({ summary: 'ثبت موقعیت لحظه‌ای سفیر' })
  @Roles('driver')
  async logLocation(
    @CurrentUser() user: AuthUser,
    @Body() dto: LogLocationDto,
  ) {
    const log = await this.driversService.logLocation(user.id, dto);
    return { ok: true, log };
  }
}
