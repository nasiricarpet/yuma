import { Module } from '@nestjs/common';
import { AdminAuditController } from './audit.controller';
import { AuditService } from './audit.service';

/**
 * ماژول ممیزی — ثبت و بازیابی رویدادهای سیستمی
 *
 * AuditService به سایر ماژول‌ها export می‌شود تا هر تغییری
 * (تغییر نقش، تغییر وضعیت سفارش و...) قابل ثبت باشد.
 */
@Module({
  controllers: [AdminAuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
