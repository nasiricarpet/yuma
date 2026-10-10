import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendResult, SmsProvider } from './sms-provider.interface';

/** آدرس پیش‌فرض وب‌سرویس کاونگر */
const KAVENEGAR_BASE_URL = 'https://api.kavenegar.com/v1';

/**
 * پروایدر پیامک کاونگر — ارسال واقعی از طریق وب‌سرویس کاونگر
 *
 * مسیر وب‌سرویس: `POST {baseUrl}/{apiKey}/sms/send.json` با پارامترهای
 * `receptor`، `sender` و `message` (form-encoded). کلید API و شماره فرستنده
 * از متغیرهای محیطی `KAVENEGAR_API_KEY` و `KAVENEGAR_SENDER` خوانده می‌شوند.
 *
 * در صورت خرابی شبکه یا پاسخ ناموفق، خطا پرتاب می‌شود تا صف BullMQ طبق
 * تنظیمات retry دوباره تلاش کند.
 */
@Injectable()
export class KavenegarProvider implements SmsProvider {
  private readonly logger = new Logger(KavenegarProvider.name);
  readonly name = 'kavenegar';

  constructor(private readonly config: ConfigService) {}

  async send(to: string, body: string): Promise<SendResult> {
    const apiKey = this.config.get<string>('KAVENEGAR_API_KEY');
    if (!apiKey) throw new Error('KAVENEGAR_API_KEY تنظیم نشده است');

    const baseUrl = this.config.get<string>('KAVENEGAR_BASE_URL') ?? KAVENEGAR_BASE_URL;
    const sender =
      this.config.get<string>('KAVENEGAR_SENDER') ?? '';

    const params = new URLSearchParams({ receptor: to, message: body });
    if (sender) params.append('sender', sender);

    const response = await fetch(`${baseUrl}/${apiKey}/sms/send.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`خطای کاونگر (HTTP ${response.status}): ${text}`);
    }

    const payload = (await response.json()) as {
      return?: { status?: number; message?: string };
      entries?: Array<{ messageid?: number }>;
    };

    const status = payload.return?.status;
    const providerRef = payload.entries?.[0]?.messageid?.toString();

    if (status !== 200) {
      return {
        status: 'failed',
        providerRef,
        error: payload.return?.message ?? `کد وضعیت کاونگر: ${status}`,
      };
    }

    this.logger.log(`📱 پیامک کاونگر به ${to} ارسال شد — ref: ${providerRef ?? 'نامشخص'}`);
    return { status: 'sent', providerRef };
  }
}
