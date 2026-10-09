import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { WorkshopOrdersController } from './workshop-orders.controller';
import { DriverOrdersController } from './driver-orders.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { OrdersService } from './orders.service';
import { OrderStateMachine } from './state-machine/order-state-machine';
import { StorageModule } from '../../shared/storage/storage.module';
import { LaundriesModule } from '../laundries/laundries.module';
import { DriversModule } from '../drivers/drivers.module';

/**
 * ماژول سفارش‌ها — سمت مشتری، کارگاه، سفیر و ادمین به‌علاوهٔ ماشین وضعیت
 *
 * LaundriesService و DriversService برای استخراج شناسه پروفایل کارگاه
 * و سفیرِ لاگین‌شده در مسیرهای مربوطه وارد شده‌اند. گارد JWT به صورت
 * سراسری در AuthModule ثبت شده است.
 */
@Module({
  imports: [StorageModule, LaundriesModule, DriversModule],
  controllers: [
    OrdersController,
    WorkshopOrdersController,
    DriverOrdersController,
    AdminOrdersController,
  ],
  providers: [OrdersService, OrderStateMachine],
  exports: [OrdersService, OrderStateMachine],
})
export class OrdersModule {}
