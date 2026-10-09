import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
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
 * خروجی درخواست کد تأیید
 */
export interface OtpRequestResult {
  /** مدت اعتبار کد به ثانیه */
  expiresIn: number;
  /**
   * کد تولیدشده — فقط در محیط غیر production پر می‌شود تا
   * تست دستی ساده شود. در production هرگز در response قرار نمی‌گیرد.
   */
  devCode?: string;
}

/**
 * سرویس OTP — تولید و بررسی کد تأیید موبایل
 * کد در Redis با انقضای ۱۰ دقیقه نگهداری می‌شود
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly mail: MailService,
  ) {}

  /**
   * درخواست کد تأیید جدید
   *
   * در محیط توسعه کد در `devCode` برگردانده و لاگ می‌شود تا تست دستی
   * بدون ارسال پیامک ممکن باشد؛ در production کد فقط از طریق کانال واقعی
   * (ایمیل/SMS) تحویل داده می‌شود و در پاسخ برنمی‌گردد.
   */
  async request(mobile: string): Promise<OtpRequestResult> {
    const normalized = normalizeMobile(mobile);
    await this.assertRateLimit(normalized);

    const code = this.generateCode();
    await this.redis.set(`otp:${normalized}`, code, OTP_TTL_SECONDS);

    // ارسال کد (در dev فقط log می‌شود، در prod ایمیل/SMS)
    await this.mail.sendOtp(`${normalized}@yuma.local`, code);

    if (process.env.NODE_ENV !== 'production') {
      this.logger.warn(`🔑 DEV OTP for ${mobile}: ${code}`);
      return { expiresIn: OTP_TTL_SECONDS, devCode: code };
    }

    return { expiresIn: OTP_TTL_SECONDS };
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
