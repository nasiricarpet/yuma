import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import type { SuccessResponse } from '../../users/users.controller';
import { SettingsService } from '../settings.service';

/**
 * کنترلر تنظیمات عمومی — مسیر /settings/public
 *
 * @Public یعنی بدون احراز هویت؛ فقط تنظیماتی که `isPublic` باشند
 * برگردانده می‌شوند. مقادیر حساس هرگز نباید عمومی شوند.
 */
@ApiTags('تنظیمات')
@Public()
@Controller('settings/public')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت تنظیمات عمومی برنامه (بدون نیاز به ورود)' })
  async getPublic(): Promise<SuccessResponse<Record<string, unknown>>> {
    const data = await this.settingsService.getPublic();
    return { success: true, data };
  }
}
