import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { PaymentCapturedEvent } from '../notifications/events';
import { LedgerService } from './ledger.service';

/**
 * Listener رویداد `payment.captured` — دفتر کل را پس از commit پرداخت ثبت می‌کند
 *
 * این رویداد بعد از commit تراکنش پرداخت انتشار می‌یابد، پس شکست ثبت
 * دفتر کل روی وضعیت پرداخت اثر نمی‌گذارد. ثبت خود متد `record` idempotent
 * است تا انتشار مجدد رویداد قلم تکراری نسازد.
 */
@Injectable()
export class LedgerListener {
  private readonly logger = new Logger(LedgerListener.name);

  constructor(private readonly ledger: LedgerService) {}

  @OnEvent('payment.captured')
  async handleCaptured(payload: PaymentCapturedEvent): Promise<void> {
    try {
      await this.ledger.recordCapturedEvent(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `ثبت دفتر کل ناموفق — paymentId: ${payload.paymentId} | ${message}`,
      );
    }
  }
}
