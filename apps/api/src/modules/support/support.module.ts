import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuditModule } from '../audit-log/audit.module';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { AdminSupportController } from './admin-support.controller';
import {
  SlaProcessor,
  SUPPORT_QUEUE,
} from './jobs/sla.processor';

/**
 * ماژول تیکت‌های پشتیبانی
 *
 * دو کنترلر دارد: `SupportController` برای مشتری (مسیر `/tickets`) که
 * فقط تیکت‌های خودش و پیام‌های عمومی را می‌بیند، و `AdminSupportController`
 * برای پشتیبان (مسیر `/support/tickets`) که تخصیص، تغییر وضعیت و
 * پیام‌های داخلی را مدیریت می‌کند.
 *
 * مهلت پاسخ اولیه (SLA) در `SupportService` محاسبه می‌شود؛ یک job
 * تاخیرشده در صف `support` در زمان مقرر برای هشدار نقض قرار می‌گیرد
 * و `SlaProcessor` آن را پردازش می‌کند. اسکن دوره‌ای هم به‌عنوان
 * برگه‌ی اطمینان در `support.module.ts` ثبت شده است.
 *
 * `EventEmitterModule` و `BullModule.forRoot` باید در `AppModule` ثبت
 * شده باشند — این ماژول فقط صف `support` را ثبت می‌کند.
 */
@Module({
  imports: [AuditModule, BullModule.registerQueue({ name: SUPPORT_QUEUE })],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService, SlaProcessor],
  exports: [SupportService],
})
export class SupportModule {}
