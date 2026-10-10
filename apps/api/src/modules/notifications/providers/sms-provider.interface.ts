/** کانال‌های ارسال اعلان — فعلاً فقط پیامک پیاده‌سازی شده */
export type NotificationChannel = 'sms' | 'email';

/** وضعیت رکورد اعلان در دیتابیس */
export type NotificationStatus = 'queued' | 'sent' | 'failed';

/** نتیجه ارسال توسط پروایدر */
export interface SendResult {
  /** مرجع پیام در پروایدر — برای رهگیری تحویل */
  providerRef?: string;
  /** وضعیت نهایی ارسال */
  status: 'sent' | 'failed';
  /** پیام خطا در صورت شکست */
  error?: string;
}

/**
 * پروایدر ارسال پیامک
 *
 * دو پیاده‌سازی دارد:
 *  - {@link KavenegarProvider} برای production
 *  - {@link MockSmsProvider} برای development (فقط لاگ می‌کند)
 */
export interface SmsProvider {
  /** نام پروایدر — برای لاگ و تشخیص */
  readonly name: string;
  /** ارسال متن پیامک به گیرنده */
  send(to: string, body: string): Promise<SendResult>;
}

/** توکن تزریق پروایدر پیامک انتخاب‌شده بر اساس محیط */
export const SMS_PROVIDER = 'SMS_PROVIDER';
