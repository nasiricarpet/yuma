import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import type { SuccessResponse } from '../users/users.controller';
import { AuditService } from './audit.service';
import { ListAuditDto } from './dto/list-audit.dto';

/**
 * کنترلر رویدادهای ممیزی در پنل مدیریت — مسیر /admin/audit-log
 *
 * مدیران سیستم و مدیران عملیاتی می‌توانند تاریخچه‌ی تغییرات را ببینند.
 */
@ApiTags('ممیزی')
@Roles('admin', 'manager')
@Controller('admin/audit-log')
export class AdminAuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'لیست صفحه‌بندی‌شده‌ی رویدادهای ممیزی با فیلتر' })
  async list(@Query() dto: ListAuditDto): Promise<SuccessResponse<unknown>> {
    const data = await this.auditService.list(dto);
    return { success: true, data };
  }

  @Get('stats')
  @ApiOperation({ summary: 'آمار رویدادها بر اساس عمل و نوع موجودیت' })
  async stats(@Query() dto: ListAuditDto): Promise<SuccessResponse<unknown>> {
    const data = await this.auditService.stats(dto);
    return { success: true, data };
  }
}
