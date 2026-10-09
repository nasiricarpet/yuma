import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { normalizeMobile } from '@yuma/validators';
import { RedisService } from '../../../redis/redis.service';
import { MailService } from '../../../common/mail/mail.service';
import { faMessages } from '../../../common/messages.fa';

/** اعتبار کد: ۱۰ دقیقه */
const OTP_TTL_SECONDS = 600;
/** طول کد: ۶ رقم */
const OTP_LENGTH = 6;
/** سقف درخواست در پنجره */
const RATE_LIMIT_MAX = 3;
/** پنجره محدودیت: ۱۰ دقیقه */
const RATE_LIMIT_WINDOW_SECONDS = 600;

/**
 * سرویس OTP — تولید و بررسی کد تأیید موبایل
 * کد در Redis با انقضای ۱۰ دقیقه نگهداری می‌شود
 */
@Injectable()
export class OtpService {
  constructor(
    private readonly redis: RedisService,
    private readonly mail: MailService,
  ) {}

  /** درخواست کد تأیید جدید؛ خروجی برای ارسال پیامک است */
  async request(mobile: string): Promise<string> {
    const normalized = normalizeMobile(mobile);
    await this.assertRateLimit(normalized);

    const code = this.generateCode();
    await this.redis.set(`otp:${normalized}`, code, OTP_TTL_SECONDS);

    // ارسال کد (در dev فقط log می‌شود، در prod ایمیل/SMS)
    await this.mail.sendOtp(`${normalized}@yuma.local`, code);

    return code;
  }

  /** بررسی کد واردشده؛ در صورت تطابق کد حذف می‌شود */
  async verify(mobile: string, code: string): Promise<boolean> {
    const normalized = normalizeMobile(mobile);
    const stored = await this.redis.get(`otp:${normalized}`);

    if (stored === null) throw new BadRequestException(faMessages.auth.otpExpired);
    if (stored !== code.trim()) throw new BadRequestException(faMessages.auth.otpInvalid);

    await this.redis.del(`otp:${normalized}`);
    return true;
  }

  /** شمارش درخواست‌ها در پنجره ۱۰ دقیقه‌ای */
  private async assertRateLimit(mobile: string): Promise<void> {
    const key = `otp:rl:${mobile}`;
    const count = Number(await this.redis.get(key)) ?? 0;

    if (count >= RATE_LIMIT_MAX) {
      throw new HttpException(faMessages.auth.otpRateLimited, HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.redis.set(key, String(count + 1), RATE_LIMIT_WINDOW_SECONDS);
  }

  /** کد ۶ رقمی تصادفی در بازه ۱۰۰۰۰۰ تا ۹۹۹۹۹۹ */
  private generateCode(): string {
    const min = 10 ** (OTP_LENGTH - 1);
    return Math.floor(min + Math.random() * 9 * min).toString();
  }
}
