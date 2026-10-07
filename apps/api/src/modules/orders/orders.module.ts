import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStateMachine } from './state-machine/order-state-machine';
import { StorageModule } from '../../shared/storage/storage.module';

/**
 * ماژول سفارش‌ها — ثبت، مشاهده، آپلود رسانه و ماشین وضعیت
 * گارد JWT به صورت سراسری در AuthModule ثبت شده است
 */
@Module({
  imports: [StorageModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderStateMachine],
  exports: [OrdersService, OrderStateMachine],
})
export class OrdersModule {}
