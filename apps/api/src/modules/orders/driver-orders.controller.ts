import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { DriversService } from '../drivers/drivers.service';
import { OrdersService } from './orders.service';
import { ChangeStatusDto } from './dto/change-status.dto';

/**
 * کنترلر سفارش‌های سفیر — لیست و تغییر وضعیت سفارش‌های تخصیص‌یافته
 *
 * سفیر فقط سفارش‌های خودش را می‌بیند و فقط انتقال‌های مجاز نقش driver
 * (برداشت، در مسیر تحویل و تحویل) را می‌تواند انجام دهد. شناسه پروفایل
 * سفیر از روی کاربر لاگین‌شده استخراج می‌شود.
 *
 * مسیرهای `/driver/assignments` (لیست وظایف و تغییر وضعیت وظیفه) در
 * ماژول assignments تعریف شده‌اند؛ اینجا فقط عملیات روی خود سفارش است.
 *
 * گارد JWT و RolesGuard به صورت سراسری در AuthModule ثبت شده‌اند.
 */
@ApiTags('سفیر — سفارش‌ها')
@Controller('driver/orders')
@Roles('driver')
export class DriverOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly driversService: DriversService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'لیست سفارش‌های سفیر لاگین‌شده (جدیدترین اول)' })
  async list(@CurrentUser() user: AuthUser) {
    const driver = await this.driversService.getMyProfile(user.id);
    const orders = await this.ordersService.getDriverOrders(driver.id);
    return { ok: true, orders };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغییر وضعیت یکی از سفارش‌های سفیر' })
  async updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') orderId: string,
    @Body() dto: ChangeStatusDto,
  ) {
    const driver = await this.driversService.getMyProfile(user.id);
    const order = await this.ordersService.updateDriverOrderStatus(
      user,
      driver.id,
      orderId,
      dto.toStatus,
      dto.note,
    );
    return { ok: true, order };
  }
}
