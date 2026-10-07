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

/**
 * کنترلر کاربران — مدیریت پروفایل و دفترچه آدرس
 * تمام مسیرها توسط گارد سراسری JWT محافظت می‌شوند و
 * شناسه کاربر از طریق @CurrentUser() استخراج می‌شود
 */
@ApiTags('کاربران')
@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت پروفایل کاربر' })
  async me(@CurrentUser() user: AuthUser) {
    const profile = await this.usersService.getProfile(user.id);
    return { ok: true, ...profile };
  }

  @Patch()
  @ApiOperation({ summary: 'به‌روزرسانی پروفایل کاربر' })
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.usersService.updateProfile(user.id, dto);
    return { ok: true, ...profile };
  }

  @Get('addresses')
  @ApiOperation({ summary: 'دریافت لیست آدرس‌های کاربر' })
  async addresses(@CurrentUser() user: AuthUser) {
    const addresses = await this.usersService.getUserAddresses(user.id);
    return { ok: true, addresses };
  }

  @Post('addresses')
  @ApiOperation({ summary: 'افزودن آدرس جدید' })
  async addAddress(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAddressDto,
  ) {
    const address = await this.usersService.addAddress(user.id, dto);
    return { ok: true, address };
  }

  @Patch('addresses/:id/default')
  @ApiOperation({ summary: 'تنظیم آدرس پیش‌فرض' })
  async setDefaultAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') addressId: string,
  ) {
    await this.usersService.setDefaultAddress(user.id, addressId);
    return { ok: true };
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'حذف آدرس' })
  async deleteAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') addressId: string,
  ) {
    await this.usersService.deleteAddress(user.id, addressId);
    return { ok: true };
  }
}
