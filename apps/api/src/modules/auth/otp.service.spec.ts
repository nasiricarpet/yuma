import { BadRequestException, HttpException } from '@nestjs/common';
import { OtpService } from './services/otp.service';

/**
 * شبیه‌سازی RedisService — کلیدها با TTL در یک Map نگهداری می‌شوند
 */
const redis = {
  store: new Map<string, { value: string; ttl?: number }>(),
  async get(key: string): Promise<string | null> {
    return this.store.has(key) ? this.store.get(key)!.value : null;
  },
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, { value, ttl: ttlSeconds });
  },
  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  },
};

/** شبیه‌سازی MailService — در تست‌ها چیزی ارسال نمی‌شود */
const mail = {
  sent: [] as Array<{ to: string; code: string }>,
  async sendOtp(to: string, code: string): Promise<void> {
    this.sent.push({ to, code });
  },
};

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(() => {
    redis.store.clear();
    mail.sent.length = 0;
    service = new OtpService(redis as never, mail as never);
  });

  it('کد ۶ رقمی تولید و با انقضای ۶۰۰ ثانیه ذخیره می‌شود', async () => {
    const code = await service.request('0912-345 6789');

    expect(code).toMatch(/^\d{6}$/);
    expect(redis.store.get('otp:09123456789')).toEqual({ value: code, ttl: 600 });
    expect(mail.sent).toContainEqual({
      to: '09123456789@yuma.local',
      code,
    });
  });

  it('موبایل فارسی‌شده نرمال می‌شود', async () => {
    await service.request('۰۰۹۸۹۱۲۳۴۵۶۷۸۹');

    expect(redis.store.has('otp:09123456789')).toBe(true);
  });

  it('کد درست تأیید و سپس حذف می‌شود', async () => {
    const code = await service.request('09123456789');

    await expect(service.verify('09123456789', code)).resolves.toBe(true);
    expect(redis.store.has('otp:09123456789')).toBe(false);
  });

  it('کد اشتباه با خطای ۴۰۰ رد می‌شود', async () => {
    await service.request('09123456789');

    await expect(service.verify('09123456789', '000000')).rejects.toThrow(BadRequestException);
  });

  it('کد منقضی‌شده با خطای ۴۰۰ رد می‌شود', async () => {
    await expect(service.verify('09123456789', '123456')).rejects.toThrow(BadRequestException);
  });

  it('درخواست چهارم در پنجره ۱۰ دقیقه‌ای محدود می‌شود', async () => {
    await service.request('09123456789');
    await service.request('09123456789');
    await service.request('09123456789');

    await expect(service.request('09123456789')).rejects.toThrow(HttpException);
    expect(redis.store.get('otp:rl:09123456789')).toEqual({ value: '3', ttl: 600 });
  });
});
