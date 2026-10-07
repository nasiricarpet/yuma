import { Module } from '@nestjs/common';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';

/**
 * ماژول سفیران — پروفایل، دسترسی‌پذیری و موقعیت لحظه‌ای
 *
 * گارد JWT و RolesGuard به صورت سراسری در AuthModule ثبت شده‌اند
 * و نیازی به import مجدد آن‌ها در اینجا نیست.
 */
@Module({
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}
