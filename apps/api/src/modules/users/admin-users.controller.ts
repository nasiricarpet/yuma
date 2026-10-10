import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import type { SuccessResponse } from './users.controller';
import { AdminListUsersDto } from './dto/admin-list-users.dto';
import { AdminUpdateUserStatusDto } from './dto/admin-update-user-status.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeUserRoleDto } from './dto/change-user-role.dto';

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

  @Post()
  @ApiOperation({ summary: 'ساخت کاربر جدید با نقش مشخص' })
  async create(
    @Body() dto: CreateUserDto,
  ): Promise<SuccessResponse<unknown>> {
    const data = await this.usersService.createUser(dto);
    return { success: true, data };
  }

  /**
   * لیست پرسنل سامانه — باید قبل از مسیر پارامتری `:id` تعریف شود
   * تا NestJS مسیر `/staff` را با پارامتر `id="staff"` اشتباه نگیرد
   */
  @Get('staff')
  @ApiOperation({ summary: 'لیست پرسنل (مدیر، کارشناس، پشتیبان، مالی)' })
  async staff(): Promise<SuccessResponse<unknown>> {
    const data = await this.usersService.listStaff();
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات یک کاربر' })
  async detail(@Param('id') id: string): Promise<SuccessResponse<unknown>> {
    const data = await this.usersService.getUserById(id);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش کاربر (نام، کد ملی، ایمیل، نقش، وضعیت)' })
  async update(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<SuccessResponse<unknown>> {
    const data = await this.usersService.updateUser(admin.id, id, dto);
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

  @Patch(':id/role')
  @ApiOperation({ summary: 'تغییر نقش کاربر' })
  async changeRole(
    @Param('id') id: string,
    @Body() dto: ChangeUserRoleDto,
  ): Promise<SuccessResponse<unknown>> {
    const data = await this.usersService.changeUserRole(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف کاربر (حذف نرم)' })
  async remove(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
  ): Promise<SuccessResponse<Record<string, never>>> {
    await this.usersService.deleteUser(admin.id, id);
    return { success: true, data: {} };
  }
}
