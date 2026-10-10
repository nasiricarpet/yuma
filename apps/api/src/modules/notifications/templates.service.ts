import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationTemplate } from '@yuma/db';
import { PrismaService } from '../../database/prisma.service';
import { NotificationChannel } from './providers/sms-provider.interface';

/** زبان پیش‌فرض قالب‌ها — فعلاً فقط فارسی داریم */
const DEFAULT_LOCALE = 'fa';

/** الگوی متغیرهای داخل قالب: {{name}} یا {{ name }} */
const VARIABLE_PATTERN = /\{\{\s*(\w+)\s*\}\}/g;

/**
 * سرویس قالب‌های اعلان
 *
 * قالب‌ها از جدول `notification_templates` بارگذاری و با متغیرهای
 * دریافتی جایگزین می‌شوند. برای جلوگیری از کوئری تکراری، قالب‌های
 * فعال در حافظه کش می‌شوند (با کلید code|channel|locale).
 */
@Injectable()
export class NotificationTemplatesService {
  private readonly logger = new Logger(NotificationTemplatesService.name);
  private readonly cache = new Map<string, NotificationTemplate>();

  constructor(private readonly prisma: PrismaService) {}

  /** بارگذاری آخرین نسخهٔ فعال یک قالب */
  async load(
    code: string,
    channel: NotificationChannel = 'sms',
    locale: string = DEFAULT_LOCALE,
  ): Promise<NotificationTemplate> {
    const cacheKey = `${code}|${channel}|${locale}`;

    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const template = await this.prisma.notificationTemplate.findFirst({
      where: { code, channel, locale, isActive: true },
      orderBy: { version: 'desc' },
    });

    if (!template) {
      throw new NotFoundException(
        `قالب اعلان پیدا نشد: code=${code} channel=${channel} locale=${locale}`,
      );
    }

    this.cache.set(cacheKey, template);
    return template;
  }

  /** جایگزینی متغیرهای {{name}} با مقادیر داده‌شده */
  render(body: string, data: Record<string, string | number>): string {
    return body.replace(VARIABLE_PATTERN, (match, key: string) => {
      const value = data[key];
      if (value === undefined || value === null) {
        this.logger.warn(`متغیر قالب تعریف نشده: ${key}`);
        return '';
      }
      return String(value);
    });
  }

  /** بارگذاری قالب و رندر نهایی موضوع و متن */
  async renderTemplate(
    code: string,
    data: Record<string, string | number>,
    channel: NotificationChannel = 'sms',
    locale: string = DEFAULT_LOCALE,
  ): Promise<{ subject: string | null; body: string }> {
    const template = await this.load(code, channel, locale);
    return {
      subject: template.subject ? this.render(template.subject, data) : null,
      body: this.render(template.body, data),
    };
  }
}
