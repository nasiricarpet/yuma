import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaymentsService } from './payments.service';

/**
 * کنترلر پرداخت — آغاز تراکنش و دریافت کال‌بک درگاه زرین‌پال
 *
 * مسیر initiate نیازمند احراز هویت مشتری است، ولی مسیر callback
 * عمومی است زیرا توسط درگاه و بدون توکن فراخوانی می‌شود.
 */
@ApiTags('پرداخت')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:orderId/initiate')
  @ApiOperation({ summary: 'آغاز پرداخت سفارش توسط مشتری' })
  @Roles('customer')
  async initiate(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
  ) {
    const result = await this.paymentsService.initiatePayment(orderId, user.id);
    return { ok: true, ...result };
  }

  @Get('callback')
  @ApiOperation({ summary: 'کال‌بک عمومی درگاه زرین‌پال پس از پرداخت' })
  @ApiQuery({
    name: 'Authority',
    description: 'شناسه تراکنش دریافتی از درگاه',
    type: String,
  })
  @ApiQuery({
    name: 'Status',
    description: 'وضعیت بازگشتی درگاه (OK/NOK)',
    required: false,
    type: String,
  })
  @Public()
  async callback(@Query('Authority') authority: string) {
    const payment = await this.paymentsService.verifyCallback(authority);
    return { ok: true, payment };
  }
}
