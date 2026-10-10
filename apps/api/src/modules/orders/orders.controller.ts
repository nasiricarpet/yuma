import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

/** حداکثر تعداد تصاویر قابل آپلود در هر درخواست */
const MAX_MEDIA_FILES = 5;

/**
 * کنترلر سفارش‌ها — سمت مشتری و پیگیری عمومی
 *
 * مسیرهای احراز‌هویت‌شده با @Roles('customer') محدود شده‌اند و
 * شناسه مشتری از طریق @CurrentUser() استخراج می‌شود، بنابراین
 * مشتری فقط به سفارش‌های خودش دسترسی دارد.
 *
 * مسیر `track/:code` با @Public بدون توکن قابل دسترسی است و
 * اطلاعات تماس مشتری را برنمی‌گرداند.
 *
 * گارد JWT و RolesGuard به صورت سراسری در AuthModule ثبت شده‌اند.
 */
@ApiTags('سفارش‌ها')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'ثبت سفارش جدید توسط مشتری' })
  @Roles('customer')
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
  ) {
    const order = await this.ordersService.createOrder(user, dto, req);
    return { ok: true, order };
  }

  @Get()
  @ApiOperation({ summary: 'لیست سفارشات مشتری لاگین‌شده (جدیدترین اول)' })
  @Roles('customer')
  async list(@CurrentUser() user: AuthUser) {
    const orders = await this.ordersService.getCustomerOrders(user.id);
    return { ok: true, orders };
  }

  @Get('track/:code')
  @ApiOperation({ summary: 'پیگیری عمومی سفارش با کد پیگیری (بدون توکن)' })
  @Public()
  async track(@Param('code') code: string) {
    const order = await this.ordersService.trackByCode(code);
    return { ok: true, order };
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات یکی از سفارش‌های مشتری' })
  @Roles('customer')
  async getOne(@CurrentUser() user: AuthUser, @Param('id') orderId: string) {
    const order = await this.ordersService.getCustomerOrder(user.id, orderId);
    return { ok: true, order };
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'لغو سفارش توسط مشتری (فقط قبل از تحویل)' })
  @Roles('customer')
  async cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') orderId: string,
    @Body() dto: CancelOrderDto,
    @Req() req: Request,
  ) {
    const order = await this.ordersService.cancelOrder(
      user,
      orderId,
      dto.reason,
      req,
    );
    return { ok: true, order };
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'تاریخچه تغییرات وضعیت سفارش' })
  @Roles('customer')
  async history(@CurrentUser() user: AuthUser, @Param('id') orderId: string) {
    const history = await this.ordersService.getOrderHistory(user.id, orderId);
    return { ok: true, history };
  }

  @Post(':id/media')
  @ApiOperation({ summary: 'آپلود تصاویر سفارش (حداکثر ۵ فایل)' })
  @ApiConsumes('multipart/form-data')
  @Roles('customer')
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
}
