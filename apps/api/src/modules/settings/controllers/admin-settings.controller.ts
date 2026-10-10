import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import type { SuccessResponse } from '../../users/users.controller';
import { SettingsService } from '../settings.service';
import { ListSettingsDto } from '../dto/list-settings.dto';
import { UpdateSettingDto } from '../dto/update-setting.dto';

/**
 * کنترلر مدیریت تنظیمات در پنل ادمین — مسیر /admin/settings
 *
 * گارد JWT سراسری ابتدا احراز هویت را انجام می‌دهد، سپس
 * @Roles('admin') دسترسی را محدود می‌کند.
 */
@ApiTags('تنظیمات')
@Roles('admin')
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'لیست صفحه‌بندی‌شده‌ی تنظیمات با فیلتر' })
  async list(@Query() dto: ListSettingsDto): Promise<SuccessResponse<unknown>> {
    const data = await this.settingsService.list(dto);
    return { success: true, data };
  }

  @Put(':key')
  @ApiOperation({ summary: 'بروزرسانی مقدار یک تنظیم (یا ساخت آن)' })
  async update(
    @CurrentUser() admin: AuthUser,
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
  ): Promise<SuccessResponse<unknown>> {
    const data = await this.settingsService.update(
      key,
      dto.value,
      admin.id,
      dto.isPublic,
    );
    return { success: true, data };
  }
}
