import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrdersService } from './orders.service';
import { AdminListOrdersDto } from './dto/admin-list-orders.dto';
import { AssignWorkshopDto } from './dto/assign-workshop.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

/**
 * کنترلر سفارش‌های ادمین — اتاق فرماندهی
 *
 * ادمین به همهٔ سفارش‌ها دسترسی دارد، می‌تواند با فیلتر پیشرفته لیست
 * کند، هر وضعیتی را تغییر دهد (override با دلیل)، کارگاه و سفیر
 * تخصیص دهد و سفارش را لغو کند.
 *
 * گارد JWT و RolesGuard به صورت سراسری در AuthModule ثبت شده‌اند.
 */
@ApiTags('ادمین — سفارش‌ها')
@Controller('admin/orders')
@Roles('admin')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('stats')
  @ApiOperation({ summary: 'آمار کلی سفارش‌ها — تعداد هر وضعیت' })
  async stats() {
    const stats = await this.ordersService.getOrderStats();
    return { ok: true, stats };
  }

  @Get()
  @ApiOperation({ summary: 'لیست سفارش‌ها با فیلتر پیشرفته و صفحه‌بندی' })
  async list(@Query() dto: AdminListOrdersDto) {
    const result = await this.ordersService.listOrdersForAdmin(dto);
    return { ok: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات کامل یک سفارش با همهٔ روابط' })
  async getOne(@Param('id') orderId: string) {
    const order = await this.ordersService.getOrderForAdmin(orderId);
    return { ok: true, order };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغییر وضعیت سفارش توسط ادمین (override با دلیل)' })
  async updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') orderId: string,
    @Body() dto: ChangeStatusDto,
    @Req() req: Request,
  ) {
    const order = await this.ordersService.adminUpdateOrderStatus(
      user,
      orderId,
      dto.toStatus,
      dto.note,
      req,
    );
    return { ok: true, order };
  }

  @Patch(':id/assign-workshop')
  @ApiOperation({ summary: 'تخصیص دستی کارگاه به سفارش' })
  async assignWorkshop(
    @CurrentUser() user: AuthUser,
    @Param('id') orderId: string,
    @Body() dto: AssignWorkshopDto,
  ) {
    const order = await this.ordersService.assignWorkshop(
      user,
      orderId,
      dto.laundryId,
      dto.note,
    );
    return { ok: true, order };
  }

  @Patch(':id/assign-driver')
  @ApiOperation({ summary: 'تخصیص دستی سفیر به سفارش' })
  async assignDriver(
    @CurrentUser() user: AuthUser,
    @Param('id') orderId: string,
    @Body() dto: AssignDriverDto,
  ) {
    const order = await this.ordersService.assignDriver(
      user,
      orderId,
      dto.driverId,
      dto.note,
    );
    return { ok: true, order };
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'لغو سفارش توسط ادمین با دلیل' })
  async cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') orderId: string,
    @Body() dto: CancelOrderDto,
    @Req() req: Request,
  ) {
    const order = await this.ordersService.cancelOrderAdmin(
      user,
      orderId,
      dto.reason,
      req,
    );
    return { ok: true, order };
  }
}
