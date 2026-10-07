import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AssignmentsService } from './assignments.service';
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto';

/**
 * کنترلر وظایف سفیران — دریافت و تحویل سفارش‌ها
 *
 * تمام مسیرها فقط برای نقش driver قابل دسترسی هستند.
 * گارد JWT و RolesGuard به صورت سراسری ثبت شده‌اند و
 * شناسه سفیر از طریق @CurrentUser() استخراج می‌شود.
 */
@ApiTags('وظایف سفیران')
@Controller('driver/assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  @ApiOperation({ summary: 'لیست وظایف سفیر لاگین‌شده' })
  @Roles('driver')
  async list(@CurrentUser() user: AuthUser) {
    const assignments = await this.assignmentsService.getMyAssignments(user.id);
    return { ok: true, assignments };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغییر وضعیت وظیفه (accepted، done یا failed)' })
  @Roles('driver')
  async updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') assignmentId: string,
    @Body() dto: UpdateAssignmentStatusDto,
  ) {
    const assignment = await this.assignmentsService.updateStatus(
      user.id,
      assignmentId,
      dto.status,
    );
    return { ok: true, assignment };
  }
}
