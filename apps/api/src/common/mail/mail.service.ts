import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * سرویس ارسال ایمیل — OTP و اعلان‌های سامانه
 *
 * رفتار بر اساس پیکربندی SMTP:
 *  - اگر `SMTP_HOST` تنظیم نشده باشد و محیط production نباشد، فقط کد را لاگ
 *    می‌کنیم (توسعه محلی بدون MailHog).
 *  - در غیر این صورت از طریق SMTP ارسال می‌کنیم — در توسعه، MailHog روی
 *    `localhost:1025` قرار دارد و ایمیل‌ها در `http://localhost:8025` قابل
 *    مشاهده‌اند.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST') ?? 'localhost',
      port: this.config.get<number>('SMTP_PORT') ?? 1025,
      secure: false,
      auth: this.config.get<string>('SMTP_USER')
        ? {
            user: this.config.get<string>('SMTP_USER') as string,
            pass: this.config.get<string>('SMTP_PASSWORD') as string,
          }
        : undefined,
    });
  }

  /** ارسال کد تأیید ورود — در توسعه بدون SMTP فقط لاگ می‌شود */
  async sendOtp(to: string, code: string): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST');
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';

    // در محیط توسعه بدون SMTP، فقط log کن
    if (!host && !isProduction) {
      this.logger.log(`🔑 کد OTP برای ${to}: ${code}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('MAIL_FROM') ?? 'no-reply@yuma.ir',
        to,
        subject: 'کد تأیید ورود به یوما',
        text: `کد تأیید شما: ${code}`,
        html: `<p>کد تأیید شما: <strong>${code}</strong></p>
               <p>این کد ۱۰ دقیقه اعتبار دارد.</p>`,
      });
      this.logger.log(`✉️ ایمیل OTP به ${to} ارسال شد`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`خطای ارسال ایمیل: ${message}`);
    }
  }
}
