import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { LaundriesService } from './laundries.service';
import { UpdateLaundryDto } from './dto/update-laundry.dto';
import { CreateServiceDto } from './dto/create-service.dto';

/**
 * کنترلر قالیشویی‌ها — مدیریت پروفایل و خدمات توسط مدیر قالیشویی
 *
 * تمام مسیرها فقط برای نقش laundry_manager قابل دسترسی هستند.
 * گارد JWT و RolesGuard به صورت سراسری ثبت شده‌اند و
 * شناسه مدیر از طریق @CurrentUser() استخراج می‌شود.
 */
@ApiTags('قالیشویی‌ها')
@Controller('laundry')
export class LaundriesController {
  constructor(private readonly laundriesService: LaundriesService) {}

  @Get('profile')
  @ApiOperation({ summary: 'دریافت پروفایل قالیشویی مدیر لاگین‌شده' })
  @Roles('laundry_manager')
  async getProfile(@CurrentUser() user: AuthUser) {
    const laundry = await this.laundriesService.getMyLaundry(user.id);
    return { ok: true, laundry };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'بروزرسانی پروفایل قالیشویی' })
  @Roles('laundry_manager')
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateLaundryDto,
  ) {
    const laundry = await this.laundriesService.updateMyLaundry(user.id, dto);
    return { ok: true, laundry };
  }

  @Post('services')
  @ApiOperation({ summary: 'افزودن خدمت جدید به قالیشویی' })
  @Roles('laundry_manager')
  async addService(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateServiceDto,
  ) {
    const service = await this.laundriesService.addService(user.id, dto);
    return { ok: true, service };
  }

  @Get('services')
  @ApiOperation({ summary: 'لیست خدمات قالیشویی مدیر لاگین‌شده' })
  @Roles('laundry_manager')
  async listServices(@CurrentUser() user: AuthUser) {
    const services = await this.laundriesService.getServices(user.id);
    return { ok: true, services };
  }
}
