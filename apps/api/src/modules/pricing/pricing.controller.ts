import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { LaundriesService } from '../laundries/laundries.service';
import { PricingService } from './pricing.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';

/**
 * کنترلر قیمت‌گذاری — ثبت و مشاهده پیش‌فاکتور سفارش‌ها
 *
 * کارگاه پیش‌فاکتور را ثبت می‌کند، مشتری آن را تأیید می‌کند و
 * هر سه نقش ذی‌صلاح می‌توانند آن را مشاهده کنند.
 * گارد JWT و RolesGuard به صورت سراسری در AuthModule ثبت شده‌اند.
 */
@ApiTags('قیمت‌گذاری')
@Controller('pricing')
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
    private readonly laundriesService: LaundriesService,
  ) {}

  @Post('orders/:orderId/quotation')
  @ApiOperation({ summary: 'ثبت پیش‌فاکتور سفارش توسط کارگاه' })
  @Roles('laundry_manager')
  async createQuotation(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Body() dto: CreateQuotationDto,
  ) {
    // شناسه قالیشویی مدیر لاگین‌شده استخراج می‌شود
    const laundry = await this.laundriesService.getMyLaundry(user.id);
    const quotation = await this.pricingService.createQuotation(
      orderId,
      laundry.id,
      dto,
    );
    return { ok: true, quotation };
  }

  @Patch('orders/:orderId/quotation/approve')
  @ApiOperation({ summary: 'تأیید پیش‌فاکتور توسط مشتری' })
  @Roles('customer')
  async approveQuotation(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
  ) {
    const quotation = await this.pricingService.approveQuotation(
      orderId,
      user.id,
    );
    return { ok: true, quotation };
  }

  @Get('orders/:orderId/quotation')
  @ApiOperation({ summary: 'دریافت پیش‌فاکتور سفارش' })
  @Roles('customer', 'laundry_manager', 'admin')
  async getQuotation(@Param('orderId') orderId: string) {
    const quotation = await this.pricingService.getQuotationByOrder(orderId);
    return { ok: true, quotation };
  }
}
