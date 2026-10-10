import { Inject, Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Notification } from '@yuma/db';
import { PrismaService } from '../../database/prisma.service';
import { NotificationChannel } from './providers/sms-provider.interface';
import { SMS_JOB, SMS_QUEUE } from './jobs/send-sms.processor';
import { NotificationTemplatesService } from './templates.service';

/** گزینه‌های ارسال اعلان */
export interface SendOptions {
  /** شناسهٔ کاربر گیرنده — برای صفحهٔ اعلان‌های کاربر */
  userId?: string;
  /** شناسهٔ سفارش مرتبط — برای گروه‌بندی اعلان‌های یک سفارش */
  orderId?: string;
  /** کانال ارسال — پیش‌فرض پیامک */
  channel?: NotificationChannel;
  /** زبان قالب — پیش‌فرض fa */
  locale?: string;
}

/** داده‌ی متغیرهای قالب: کلید → مقدار */
export type TemplateData = Record<string, string | number>;

/**
 * سرویس مرکزی ارسال اعلان
 *
 * یک رکورد `Notification` با وضعیت `queued` در دیتابیس می‌سازد و سپس
 * ارسال واقعی را به صف BullMQ می‌سپارد. به این ترتیب:
 *  - مسیر کاربری هرگز منتظر ارسال پیامک نمی‌ماند
 *  - در صورت شکست، retry با backoff انجام می‌شود
 *  - تاریخچهٔ کامل اعلان‌ها قابل رهگیری است
 *
 * رویدادهای دامنه (تغییر وضعیت سفارش، پرداخت، OTP) از طریق listenerها
 * این متد را صدا می‌زنند.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: NotificationTemplatesService,
    @InjectQueue(SMS_QUEUE) private readonly smsQueue: Queue,
  ) {}

  /**
   * ساخت اعلان از روی قالب و قراردادن آن در صف ارسال
   *
   * @param to گیرنده — شماره موبایل
   * @param template کد قالب — مثلاً `order_ready`
   * @param data متغیرهای قالب — مثلاً `{ trackingCode: 'YUMA-1234' }`
   * @param options گزینه‌های اضافی (کاربر، سفارش، کانال)
   * @returns رکورد اعلان با وضعیت `queued`
   */
  async send(
    to: string,
    template: string,
    data: TemplateData = {},
    options: SendOptions = {},
  ): Promise<Notification> {
    const channel: NotificationChannel = options.channel ?? 'sms';

    if (channel !== 'sms') {
      throw new NotImplementedException(
        `کانال ${channel} هنوز پیاده‌سازی نشده است`,
      );
    }

    // اعتبارسنجی قالب قبل از ثبت — اگر قالب نباشد، نیازی به رکورد نیست
    const { body } = await this.templates.renderTemplate(
      template,
      data,
      channel,
      options.locale,
    );

    const notification = await this.prisma.notification.create({
      data: {
        userId: options.userId ?? undefined,
        orderId: options.orderId ?? undefined,
        channel,
        templateCode: template,
        recipient: to,
        payload: data,
        status: 'queued',
      },
    });

    await this.smsQueue.add(
      SMS_JOB,
      { notificationId: notification.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: 200,
        removeOnFail: 500,
      },
    );

    this.logger.debug(
      `اعلان در صف قرار گرفت — id: ${notification.id} | template: ${template} | to: ${to} | body: ${body}`,
    );

    return notification;
  }
}
