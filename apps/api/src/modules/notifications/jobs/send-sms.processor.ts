import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { SMS_PROVIDER, SmsProvider } from '../providers/sms-provider.interface';
import { NotificationTemplatesService } from '../templates.service';

/** نام صف ارسال پیامک */
export const SMS_QUEUE = 'sms';
/** نام job داخل صف */
export const SMS_JOB = 'send-sms';

/** تعداد تلاش‌های مجدد در صورت شکست */
const MAX_ATTEMPTS = 3;

/**
 * پردازشگر صف ارسال پیامک
 *
 * یک رکورد اعلان با وضعیت `queued` را از دیتابیس می‌خواند، متن قالب را
 * رندر کرده و از طریق پروایدر پیامک ارسال می‌کند. در صورت شکست پروایدر:
 *  - رکورد اعلان به `failed` به‌روز می‌شود
 *  - خطا دوباره پرتاب می‌شود تا BullMQ طبق تنظیمات backoff retry کند
 *
 * توجه: این پردازش **بعد از** commit تراکنش سفارش/پرداخت اجرا می‌شود،
 * بنابراین شکست ارسال پیامک هرگز روی وضعیت سفارش اثر نمی‌گذارد.
 */
@Processor(SMS_QUEUE)
@Injectable()
export class SendSmsProcessor extends WorkerHost {
  private readonly logger = new Logger(SendSmsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: NotificationTemplatesService,
    @Inject(SMS_PROVIDER) private readonly provider: SmsProvider,
  ) {
    super();
  }

  async process(job: Job<{ notificationId: string }>): Promise<void> {
    const { notificationId } = job.data;

    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      this.logger.warn(`اعلان پیدا نشد — notificationId: ${notificationId}`);
      return;
    }

    // idempotency: اگر قبلاً ارسال شده، کاری نکن
    if (notification.status === 'sent') return;

    const { body } = await this.templates.renderTemplate(
      notification.templateCode,
      notification.payload as Record<string, string | number>,
      notification.channel as 'sms' | 'email',
    );

    try {
      const result = await this.provider.send(notification.recipient, body);

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: result.status,
          providerRef: result.providerRef,
          errorMessage: result.error,
          attempts: { increment: 1 },
          sentAt: result.status === 'sent' ? new Date() : undefined,
        },
      });

      if (result.status === 'failed') {
        throw new Error(result.error ?? 'ارسال پیامک ناموفق بود');
      }

      this.logger.debug(
        `پیامک ارسال شد — notificationId: ${notification.id} | ref: ${result.providerRef ?? 'نامشخص'}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'failed',
          errorMessage: message,
          attempts: { increment: 1 },
        },
      });

      // خطا پرتاب می‌شود تا BullMQ job را failed کند و retry انجام دهد
      if (job.attemptsMade >= MAX_ATTEMPTS - 1) {
        this.logger.error(
          `ارسال پیامک شکست خورد — notificationId: ${notification.id} | ${message}`,
        );
      }
      throw error;
    }
  }
}
