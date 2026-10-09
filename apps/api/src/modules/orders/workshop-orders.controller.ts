import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { LaundriesService } from '../laundries/laundries.service';
import { OrdersService } from './orders.service';
import { ChangeStatusDto } from './dto/change-status.dto';

/**
 * کنترلر سفارش‌های کارگاه — لیست و تغییر وضعیت سفارش‌های قالیشویی
 *
 * کارگاه فقط سفارش‌های تخصیص‌یافته به خودش را می‌بیند و فقط
 * انتقال‌های مجاز نقش خودش را می‌تواند انجام دهد. شناسه قالیشویی
 * از پروفایل مدیر/کاربر لاگین‌شده استخراج می‌شود.
 *
 * گارد JWT و RolesGuard به صورت سراسری در AuthModule ثبت شده‌اند.
 */
@ApiTags('کارگاه — سفارش‌ها')
@Controller('workshop/orders')
@Roles('laundry_manager', 'laundry_user')
export class WorkshopOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly laundriesService: LaundriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'لیست سفارش‌های کارگاه لاگین‌شده (جدیدترین اول)' })
  async list(@CurrentUser() user: AuthUser) {
    const laundry = await this.laundriesService.getMyLaundry(user.id);
    const orders = await this.ordersService.getWorkshopOrders(laundry.id);
    return { ok: true, orders };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغییر وضعیت یکی از سفارش‌های کارگاه' })
  async updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') orderId: string,
    @Body() dto: ChangeStatusDto,
  ) {
    const laundry = await this.laundriesService.getMyLaundry(user.id);
    const order = await this.ordersService.updateWorkshopOrderStatus(
      user,
      laundry.id,
      orderId,
      dto.toStatus,
      dto.note,
    );
    return { ok: true, order };
  }
}
