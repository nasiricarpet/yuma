import { Global, Module } from '@nestjs/common';
import { ZarinpalService } from './zarinpal.service';

/**
 * ماژول پرداخت — سراسری (Global) تا ZarinpalService
 * در همه ماژول‌ها بدون import مجدد در دسترس باشد
 */
@Global()
@Module({
  providers: [ZarinpalService],
  exports: [ZarinpalService],
})
export class PaymentModule {}
