import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

/** حداکثر تعداد تصاویر قابل آپلود در هر درخواست */
const MAX_MEDIA_FILES = 5;

/**
 * کنترلر سفارش‌ها — ثبت و مشاهده سفارشات مشتری
 *
 * نکته: مسیر `POST /orders` در این مرحله `customerId` را از بدنه درخواست
 * (فیلد فرضی DTO) می‌گیرد و گارد احراز هویت را درگیر نمی‌کند؛
 * سایر مسیرها توسط گارد سراسری JWT محافظت می‌شوند و شناسه کاربر
 * از طریق @CurrentUser() استخراج می‌شود.
 */
@ApiTags('سفارش‌ها')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'ثبت سفارش جدید' })
  async create(@Body() dto: CreateOrderDto) {
    const order = await this.ordersService.createOrder(dto);
    return { ok: true, order };
  }

  @Get()
  @ApiOperation({ summary: 'لیست سفارشات مشتری لاگین‌شده' })
  async list(@CurrentUser() user: AuthUser) {
    const orders = await this.ordersService.getCustomerOrders(user.id);
    return { ok: true, orders };
  }

  @Post(':id/media')
  @ApiOperation({ summary: 'آپلود تصاویر سفارش (حداکثر ۵ فایل)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', MAX_MEDIA_FILES, { storage: memoryStorage() }),
  )
  async uploadMedia(
    @CurrentUser() user: AuthUser,
    @Param('id') orderId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const media = await this.ordersService.uploadOrderMedia(
      orderId,
      user.id,
      files ?? [],
    );
    return { ok: true, media };
  }

  @Patch(':id/assign-driver')
  @ApiOperation({ summary: 'تخصیص سفیر به سفارش (فقط ادمین)' })
  @Roles('admin')
  async assignDriver(
    @Param('id') orderId: string,
    @Body() dto: AssignDriverDto,
  ) {
    const order = await this.ordersService.assignDriver(orderId, dto.driverId);
    return { ok: true, order };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغییر وضعیت سفارش (سفیر، کارگاه یا ادمین)' })
  @Roles('driver', 'laundry_manager', 'admin')
  async changeStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') orderId: string,
    @Body() dto: ChangeStatusDto,
  ) {
    const order = await this.ordersService.changeOrderStatus(
      orderId,
      user.id,
      user.role,
      dto.toStatus,
      dto.note,
    );
    return { ok: true, order };
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'لغو سفارش توسط مشتری (فقط قبل از شروع شستشو)' })
  @Roles('customer')
  async cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') orderId: string,
    @Body() dto: CancelOrderDto,
  ) {
    const order = await this.ordersService.cancelOrder(
      orderId,
      user.id,
      dto.reason,
    );
    return { ok: true, order };
  }
}
