import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

/**
 * پیشوند آدرس شبیه‌سازی‌شده‌ی درگاه زرین‌پال
 */
const ZARINPAL_GATEWAY = 'https://sandbox.zarinpal.com/pg/StartPay';

/**
 * سرویس درگاه پرداخت زرین‌پال — پیاده‌سازی موک (Mock)
 *
 * این سرویس در فاز کنونی فقط شبیه‌سازی می‌کند تا جریان پرداخت
 * بدون وابستگی زنده به درگاه قابل تست باشد. خروجی‌ها تصادفی‌اند
 * ولی ساختار آن‌ها با پاسخ واقعی زرین‌پال هم‌خوان است.
 *
 * تنظیمات از متغیرهای محیطی خوانده می‌شوند:
 * ZARINPAL_MERCHANT_ID — مرچنت‌کد درگاه
 * APP_URL — آدرس پایه اپلیکیشن برای ساخت callbackUrl
 */
@Injectable()
export class ZarinpalService {
  private readonly logger = new Logger(ZarinpalService.name);
  private readonly merchantId: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    this.merchantId = this.config.get<string>('ZARINPAL_MERCHANT_ID') ?? '';
    this.appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:3000';

    if (!this.merchantId) {
      this.logger.warn('ZARINPAL_MERCHANT_ID تنظیم نشده است — حالت موک فعال است');
    }
  }

  /**
   * آدرس بازگشت پرداخت — مسیر عمومی کال‌بک در کنترلر پرداخت
   */
  getCallbackUrl(): string {
    return `${this.appUrl}/api/payments/callback`;
  }

  /**
   * درخواست پرداخت — یک authority تصادفی تولید کرده و
   * آدرس هدایت کاربر به درگاه را برمی‌گرداند
   *
   * @param amount مبلغ به ریال
   * @param description توضیح تراکنش
   * @param callbackUrl آدرس بازگشت پس از پرداخت
   */
  async requestPayment(
    amount: number,
    description: string,
    callbackUrl: string,
  ): Promise<{ authority: string; paymentUrl: string }> {
    // authority شبیه‌سازی‌شده — ۳۶ کاراکتر hex
    const authority = randomBytes(18).toString('hex');

    this.logger.log(
      `درخواست پرداخت موک — مبلغ: ${amount} ریال | authority: ${authority}`,
      description,
    );

    return {
      authority,
      paymentUrl: `${ZARINPAL_GATEWAY}/${authority}`,
    };
  }

  /**
   * تأیید پرداخت — در نسخه موک همیشه موفق است و
   * یک کد پیگیری تصادفی به عنوان referenceId برمی‌گرداند
   *
   * @param amount مبلغ به ریال — باید با مبلغ تراکنش برابر باشد
   * @param authority شناسه دریافتی از درگاه
   */
  async verifyPayment(
    amount: number,
    authority: string,
  ): Promise<{ verified: boolean; referenceId: string; message?: string }> {
    const referenceId = randomBytes(8).toString('hex').toUpperCase();

    this.logger.log(
      `وریفای موک — authority: ${authority} | مبلغ: ${amount} ریال | کد پیگیری: ${referenceId}`,
    );

    return { verified: true, referenceId };
  }
}
