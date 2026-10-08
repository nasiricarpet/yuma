import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import type { SuccessResponse } from './users.controller';
import { AdminListUsersDto } from './dto/admin-list-users.dto';
import { AdminUpdateUserStatusDto } from './dto/admin-update-user-status.dto';

/**
 * کنترلر مدیریت کاربران در پنل ادمین — مسیر /admin/users
 *
 * گارد JWT سراسری ابتدا احراز هویت را انجام می‌دهد، سپس
 * گارد نقش‌ها (@Roles('admin')) دسترسی را محدود می‌کند.
 * موبایل کاربران برای محافظت از حریم خصوصی ماسک می‌شود.
 */
@ApiTags('مدیریت کاربران')
@Roles('admin')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'لیست صفحه‌بندی‌شده‌ی کاربران با فیلتر و جستجو' })
  async list(@Query() dto: AdminListUsersDto): Promise<SuccessResponse<unknown>> {
    const data = await this.usersService.listUsers(dto);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات یک کاربر' })
  async detail(@Param('id') id: string): Promise<SuccessResponse<unknown>> {
    const data = await this.usersService.getUserById(id);
    return { success: true, data };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'فعال یا غیرفعال کردن کاربر' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserStatusDto,
  ): Promise<SuccessResponse<unknown>> {
    const data = await this.usersService.updateUserStatus(id, dto);
    return { success: true, data };
  }
}
