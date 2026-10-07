import { Module } from '@nestjs/common';
import { LaundriesController } from './laundries.controller';
import { LaundriesService } from './laundries.service';

/**
 * ماژول قالیشویی‌ها — پروفایل و خدمات قالیشویی
 *
 * گارد JWT و RolesGuard به صورت سراسری در AuthModule ثبت شده‌اند
 * و نیازی به import مجدد آن‌ها در اینجا نیست.
 */
@Module({
  controllers: [LaundriesController],
  providers: [LaundriesService],
  exports: [LaundriesService],
})
export class LaundriesModule {}
