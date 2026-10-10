import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SupportService } from '../support.service';
import {
  SUPPORT_QUEUE,
  SUPPORT_SLA_JOB,
  SUPPORT_SLA_SCAN_JOB,
  type SlaCheckJobData,
} from '../support.constants';

/**
 * پردازشگر صف پشتیبانی — هشدار نقض SLA
 *
 * دو نوع job پردازش می‌کند:
 *  - `support:check-sla`: بررسی یک تیکت مشخص که با تاخیر تا `slaDueAt`
 *    در صف قرار گرفته است. idempotent است — اگر مشتری پیش از سررسید
 *    پاسخ گرفته باشد یا تیکت بسته شده باشد، کاری نمی‌کند.
 *  - `support:scan-sla`: اسکن دوره‌ای همه‌ی تیکت‌ها برای کشف مواردی
 *    که job تاخیرشده‌ی آن‌ها گم شده (مثلاً ری‌استارت Redis).
 *
 * شکست این پردازشگر روی جریان کاربر اثری ندارد؛ همه‌ی کارها
 * «best-effort» هستند و خطاها لاگ می‌شوند.
 */
@Processor(SUPPORT_QUEUE)
@Injectable()
export class SlaProcessor extends WorkerHost {
  private readonly logger = new Logger(SlaProcessor.name);

  constructor(private readonly support: SupportService) {
    super();
  }

  async process(job: Job<SlaCheckJobData>): Promise<void> {
    switch (job.name) {
      case SUPPORT_SLA_JOB:
        await this.handleSlaCheck(job);
        return;

      case SUPPORT_SLA_SCAN_JOB:
        await this.handleSlaScan();
        return;

      default:
        this.logger.warn(`job ناشناخته در صف پشتیبانی — name: ${job.name}`);
    }
  }

  /** بررسی یک تیکت — فقط در صورت نقض واقعی هشدار می‌دهد */
  private async handleSlaCheck(job: Job<SlaCheckJobData>): Promise<void> {
    const { ticketId } = job.data;

    try {
      const breached = await this.support.alertSlaBreach(ticketId);

      if (breached) {
        this.logger.warn(
          `هشدار نقض SLA صادر شد — ticketId: ${ticketId} | jobId: ${job.id}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `بررسی SLA ناموفق — ticketId: ${ticketId} | ${message}`,
      );
      // خطا پرتاب می‌شود تا BullMQ retry کند
      throw error;
    }
  }

  /** اسکن دوره‌ای — تعداد هشدارهای صادرشده را لاگ می‌کند */
  private async handleSlaScan(): Promise<void> {
    try {
      const alerted = await this.support.checkBreachedTickets();

      this.logger.debug(`اسکن SLA انجام شد — تعداد هشدارها: ${alerted}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`اسکن دوره‌ای SLA ناموفق — ${message}`);
      throw error;
    }
  }
}
