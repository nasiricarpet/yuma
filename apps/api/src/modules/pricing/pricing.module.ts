import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { OrdersModule } from '../orders/orders.module';
import { LaundriesModule } from '../laundries/laundries.module';

/**
 * ماژول قیمت‌گذاری — پیش‌فاکتور سفارش‌ها
 *
 * ماشین وضعیت سفارش از OrdersModule برای انتقال مجاز
 * وضعیت سفارش به quotation_sent / quotation_approved استفاده می‌شود.
 * LaundriesService برای استخراج شناسه قالیشویی مدیر لاگین‌شده وارد شده است.
 *
 * گارد JWT و RolesGuard به صورت سراسری در AuthModule ثبت شده‌اند.
 */
@Module({
  imports: [OrdersModule, LaundriesModule],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
