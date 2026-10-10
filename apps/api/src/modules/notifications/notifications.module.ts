import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { KavenegarProvider } from './providers/kavenegar.provider';
import { MockSmsProvider } from './providers/mock-sms.provider';
import { SMS_PROVIDER, SmsProvider } from './providers/sms-provider.interface';
import { NotificationService } from './notification.service';
import { NotificationTemplatesService } from './templates.service';
import { SendSmsProcessor, SMS_QUEUE } from './jobs/send-sms.processor';
import { OrderNotificationListener } from './listeners/order.listener';
import { PaymentNotificationListener } from './listeners/payment.listener';
import { OtpNotificationListener } from './listeners/otp.listener';

/**
 * انتخاب پروایدر پیامک بر اساس پیکربندی
 *
 * در حالت زیر از پروایدر mock استفاده می‌شود:
 *  - `NODE_ENV` برابر production نباشد (محیط توسعه/تست)
 *  - `KAVENEGAR_API_KEY` تنظیم نشده باشد
 *
 * این تابع از ماژول export شده تا بشود آن را مستقل تست کرد.
 */
export function chooseSmsProvider(
  config: ConfigService,
  kavenegar: KavenegarProvider,
  mock: MockSmsProvider,
): SmsProvider {
  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const hasApiKey = Boolean(config.get<string>('KAVENEGAR_API_KEY'));

  if (!isProduction || !hasApiKey) return mock;
  return kavenegar;
}

/**
 * ماژول اعلان‌ها — ارسال پیامک مبتنی بر قالب از طریق صف
 *
 * رابط عمومی این ماژول `NotificationService` است؛ listenerها رویدادهای
 * دامنه را دریافت کرده و از طریق آن پیامک می‌فرستند. پروایدر پیامک با
 * توکن `SMS_PROVIDER` تزریق می‌شود تا جایگزینی آن در محیط‌های مختلف
 * تنها از طریق پیکربندی ممکن باشد.
 *
 * `EventEmitterModule` و `BullModule.forRoot` باید در `AppModule` ثبت
 * شده باشند — این ماژول فقط صف `sms` را ثبت می‌کند.
 */
@Module({
  imports: [BullModule.registerQueue({ name: SMS_QUEUE })],
  providers: [
    NotificationService,
    NotificationTemplatesService,
    SendSmsProcessor,
    OrderNotificationListener,
    PaymentNotificationListener,
    OtpNotificationListener,
    KavenegarProvider,
    MockSmsProvider,
    {
      provide: SMS_PROVIDER,
      useFactory: chooseSmsProvider,
      inject: [ConfigService, KavenegarProvider, MockSmsProvider],
    },
  ],
  exports: [NotificationService, NotificationTemplatesService, SMS_PROVIDER],
})
export class NotificationsModule {}
