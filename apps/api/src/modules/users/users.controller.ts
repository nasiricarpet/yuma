import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

/** شکل یکسان همه‌ی پاسخ‌های موفق این ماژول */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * کنترلر پروفایل و دفترچه آدرس کاربر فعلی — مسیر /me
 *
 * تمام مسیرها توسط گارد سراسری JWT محافظت می‌شوند و
 * شناسه کاربر از طریق @CurrentUser() استخراج می‌شود.
 */
@ApiTags('کاربران')
@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت پروفایل کاربر فعلی' })
  async me(@CurrentUser() user: AuthUser): Promise<SuccessResponse<unknown>> {
    const data = await this.usersService.getProfile(user.id);
    return { success: true, data };
  }

  @Patch()
  @ApiOperation({ summary: 'ویرایش پروفایل کاربر فعلی' })
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<SuccessResponse<unknown>> {
    const data = await this.usersService.updateProfile(user.id, dto);
    return { success: true, data };
  }

  @Get('addresses')
  @ApiOperation({ summary: 'دریافت لیست آدرس‌های کاربر' })
  async addresses(@CurrentUser() user: AuthUser): Promise<SuccessResponse<unknown>> {
    const data = await this.usersService.getUserAddresses(user.id);
    return { success: true, data };
  }

  @Post('addresses')
  @ApiOperation({ summary: 'افزودن آدرس جدید (حداکثر ۵ آدرس)' })
  async addAddress(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAddressDto,
  ): Promise<SuccessResponse<unknown>> {
    const data = await this.usersService.addAddress(user.id, dto);
    return { success: true, data };
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'ویرایش آدرس' })
  async updateAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<SuccessResponse<unknown>> {
    const data = await this.usersService.updateAddress(user.id, addressId, dto);
    return { success: true, data };
  }

  @Patch('addresses/:id/default')
  @ApiOperation({ summary: 'تنظیم آدرس پیش‌فرض' })
  async setDefaultAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') addressId: string,
  ): Promise<SuccessResponse<Record<string, never>>> {
    await this.usersService.setDefaultAddress(user.id, addressId);
    return { success: true, data: {} };
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'حذف آدرس (حذف نرم)' })
  async deleteAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') addressId: string,
  ): Promise<SuccessResponse<Record<string, never>>> {
    await this.usersService.deleteAddress(user.id, addressId);
    return { success: true, data: {} };
  }
}
