import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { OrdersModule } from '../orders/orders.module';

/**
 * ماژول پرداخت — آغاز و تأیید تراکنش‌های زرین‌پال
 *
 * ماشین وضعیت سفارش از OrdersModule برای انتقال مجاز
 * وضعیت سفارش به washing پس از پرداخت موفق استفاده می‌شود.
 * ZarinpalService به صورت گلوبال از PaymentModule در دسترس است.
 *
 * گارد JWT و RolesGuard به صورت سراسری در AuthModule ثبت شده‌اند
 * و مسیر کال‌بک با @Public از آن‌ها مستثنی است.
 */
@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
