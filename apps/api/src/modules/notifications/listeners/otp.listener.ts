import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SMS_PROVIDER, SmsProvider } from '../providers/sms-provider.interface';
import { OtpRequestedEvent } from '../events';

/** پیشوند متن پیامک کد تأیید — شماره کد با متغیر داده می‌شود */
const OTP_BODY = 'کد تأیید ورود به یوما: {{code}}\nاین کد ۱۰ دقیقه اعتبار دارد.';

/**
 * Listener رویداد `otp.requested`
 *
 * کد یکبار مصرف را از طریق پروایدر پیامک ارسال می‌کند. برخلاف اعلان‌های
 * سفارش، OTP از قالب دیتابیس عبور نمی‌کند: پیام کوتاه، پرحجم و زمان‌حساس
 * است و متن آن در همین‌جا ثابت می‌ماند. در محیط development پروایدر mock
 * فقط کد را در کنسول لاگ می‌کند.
 *
 * خطای ارسال بلعیده می‌شود تا مسیر درخواست OTP متوقف نشود — کاربر می‌تواند
 * مجدداً درخواست کد بدهد (سرویس OTP کد را در Redis ذخیره کرده است).
 */
@Injectable()
export class OtpNotificationListener {
  private readonly logger = new Logger(OtpNotificationListener.name);

  constructor(@Inject(SMS_PROVIDER) private readonly provider: SmsProvider) {}

  @OnEvent('otp.requested')
  async handleOtpRequested(payload: OtpRequestedEvent): Promise<void> {
    try {
      await this.provider.send(
        payload.mobile,
        OTP_BODY.replace('{{code}}', payload.code),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `خطا در ارسال پیامک OTP به ${payload.mobile} | ${message}`,
      );
    }
  }
}
