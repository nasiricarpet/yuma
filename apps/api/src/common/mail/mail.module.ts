import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

/**
 * ماژول ایمیل — ارسال کدهای یک‌بار مصرف و اعلان‌ها
 *
 * `@Global()` است تا سرویس‌های ماژول‌های دیگر (مثل OtpService) بتوانند آن را
 * تزریق کنند بدون اینکه هر ماژول مجزا آن را import کند.
 */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
