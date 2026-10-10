import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SendResult, SmsProvider } from './sms-provider.interface';

/**
 * پروایدر پیامک mock — فقط در محیط development فعال می‌شود
 *
 * هیچ پیامکی واقعاً ارسال نمی‌کند؛ متن پیام را در کنسول لاگ می‌کند تا
 * توسعه و تست دستی بدون اتصال به کاونگر ممکن باشد. رکورد ارسال در
 * دیتابیس توسط {@link SendSmsProcessor} ذخیره می‌شود.
 */
@Injectable()
export class MockSmsProvider implements SmsProvider {
  private readonly logger = new Logger(MockSmsProvider.name);
  readonly name = 'mock';

  async send(to: string, body: string): Promise<SendResult> {
    const providerRef = `mock-${randomUUID()}`;
    this.logger.log(`📨 [MOCK SMS] به ${to}:\n${body}\n└─ ref: ${providerRef}`);
    return { status: 'sent', providerRef };
  }
}
