import { Module } from '@nestjs/common';
import { AuditModule } from '../audit-log/audit.module';
import { LedgerService } from './ledger.service';
import { LedgerListener } from './ledger.listener';
import { SettlementsService } from './settlements.service';
import { SettlementsController } from './settlements.controller';

/**
 * ماژول دفتر کل و تسویه‌ی کارگاه‌ها
 *
 * LedgerService قلم‌های دوطرفه‌ی هر پرداخت موفق را ثبت می‌کند و
 * LedgerListener به رویداد `payment.captured` گوش می‌دهد. ثبت دفتر کل
 * پس از commit تراکنش پرداخت انجام می‌شود و idempotent است.
 *
 * SettlementsService سهم کارگاه‌ها را در هر دوره جمع کرده و
 * تسویه را به‌عنوان پرداخت‌شده علامت‌گذاری می‌کند.
 */
@Module({
  imports: [AuditModule],
  controllers: [SettlementsController],
  providers: [LedgerService, LedgerListener, SettlementsService],
  exports: [LedgerService, SettlementsService],
})
export class LedgerModule {}
