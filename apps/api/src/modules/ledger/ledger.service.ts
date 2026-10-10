import { Injectable, Logger } from '@nestjs/common';
import type { Payment } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

/**
 * حساب‌های دفتر کل — ثابت شده تا در کوئری‌ها و تست‌ها یک منبع واحد باشند
 */
export const LEDGER_ACCOUNTS = [
  'customer_receivable',
  'gateway_clearing',
  'platform_revenue',
  'workshop_payable',
  'tax_payable',
] as const;

/**
 * نرخ کارمزد پلتفرم — سهم پلتفرم از هر پرداخت موفق.
 *
 * TODO: وقتی کلید تنظیمات مالی پیاده‌سازی شد، این مقدار باید از جدول
 * settings خوانده شود. تا آن زمان این ثابت منبع حقیقت است.
 */
export const PLATFORM_COMMISSION_RATE = 0.1;

/**
 * رویداد پرداخت موفق — منطبق با payload رویداد `payment.captured`
 * که از PaymentsService انتشار می‌یابد.
 */
export interface PaymentCapturedPayload {
  paymentId: string;
  orderId: string;
  trackingCode: string;
  customerId: string;
  amount: number;
  referenceId: string | null;
}

/**
 * پرداخت همراه با سفارش — ورودی `record` شامل این روابط است
 * تا حساب کارگاه و مرجع پرداخت بدون کوئری اضافه در دسترس باشند.
 */
export type PaymentWithOrder = Payment & { order: { laundryId: string | null } | null };

/**
 * سرویس دفتر کل — ثبت تراکنش‌های مالی به‌صورت دوطرفه (double-entry)
 *
 * هر پرداخت موفق یک گروه ثبت (`entryGroup`) می‌سازد که قلم‌های بدهکار
 * و بستانکار آن با هم برابر هستند. مبالغ به ریال (IRR) ذخیره می‌شوند.
 */
@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * ثبت یک پرداخت موفق در دفتر کل
   *
   * تراکنش سه قلمی (به ازای کارمزد صفر، دو قلمی):
   *  1. بدهکار  gateway_clearing     — کل مبلغ وصول‌شده از درگاه
   *  2. بستانکار platform_revenue    — کارمزد پلتفرم
   *  3. بستانکار workshop_payable    — سهم خالص کارگاه (بدهی پلتفرم به کارگاه)
   *
   * `customer_receivable` و `tax_payable` در پیاده‌سازی فعلی مستقیماً در
   * این ثبت استفاده نمی‌شوند — `customer_receivable` هنگام صدور فاکتور
   * و `tax_payable` هنگام تفکیک مالیات دوره‌ای پست می‌شوند. این متد
   * idempotent است: پرداختی که قبلاً ثبت شده دوباره ثبت نمی‌شود.
   */
  async record(payment: PaymentWithOrder): Promise<number> {
    // idempotency — جلوگیری از ثبت دوگانه در صورت انتشار مجدد رویداد
    const existing = await this.prisma.ledgerEntry.count({
      where: { paymentId: payment.id },
    });

    if (existing > 0) {
      this.logger.debug(`پرداخت قبلاً ثبت شده — paymentId: ${payment.id}`);
      return 0;
    }

    const amount = BigInt(payment.amount);
    const commission = this.calculateCommission(payment.amount);
    const workshopShare = amount - commission;
    const entryGroup = `payment:${payment.id}`;

    const entries = await this.prisma.$transaction([
      this.prisma.ledgerEntry.create({
        data: {
          entryGroup,
          orderId: payment.orderId,
          paymentId: payment.id,
          account: 'gateway_clearing',
          direction: 'debit',
          amountMinor: amount,
          currency: 'IRR',
          reference: payment.referenceId,
          description: `وصول پرداخت سفارش ${payment.orderId}`,
        },
      }),
      ...(commission > 0n
        ? [
            this.prisma.ledgerEntry.create({
              data: {
                entryGroup,
                orderId: payment.orderId,
                paymentId: payment.id,
                account: 'platform_revenue',
                direction: 'credit',
                amountMinor: commission,
                reference: payment.referenceId,
                description: `کارمزد پلتفرم سفارش ${payment.orderId}`,
              },
            }),
          ]
        : []),
      this.prisma.ledgerEntry.create({
        data: {
          entryGroup,
          orderId: payment.orderId,
          paymentId: payment.id,
          account: 'workshop_payable',
          direction: 'credit',
          amountMinor: workshopShare,
          reference: payment.referenceId,
          description: `سهم کارگاه سفارش ${payment.orderId}`,
        },
      }),
    ]);

    this.logger.log(
      `دفتر کل ثبت شد — paymentId: ${payment.id} | ${entries.length} قلم | جمع: ${payment.amount} ریال`,
    );

    return entries.length;
  }

  /**
   * دریافت پرداخت از دیتابیس و ثبت آن در دفتر کل —
   * ورودی رویداد `payment.captured` که شناسه‌ی پرداخت را در اختیار دارد.
   * اگر سفارش حذف شده باشد یا پرداخت نامعتبر باشد، بدون خطا برمی‌گردد.
   */
  async recordCapturedEvent(payload: PaymentCapturedPayload): Promise<number> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: payload.paymentId },
      include: { order: { select: { laundryId: true } } },
    });

    if (!payment) {
      this.logger.warn(
        `پرداخت برای ثبت دفتر کل یافت نشد — paymentId: ${payload.paymentId}`,
      );
      return 0;
    }

    return this.record(payment as PaymentWithOrder);
  }

  /**
   * کارمزد پلتفرم — n ریال از مبلغ پرداخت (گردشده به نزدیک‌ترین ریال)
   */
  calculateCommission(amountMinor: number): bigint {
    return BigInt(Math.round(amountMinor * PLATFORM_COMMISSION_RATE));
  }

  /**
   * مجموع قلم‌های یک حساب در بازه‌ی مشخص —
   * جهت `direction` اختیاری است تا بشود فقط بدهکارها یا بستانکارها را جمع کرد.
   */
  async sumAccount(
    account: (typeof LEDGER_ACCOUNTS)[number],
    where: { orderId?: string[]; from?: Date; to?: Date },
  ): Promise<{ debit: bigint; credit: bigint }> {
    const rows = await this.prisma.ledgerEntry.groupBy({
      by: ['direction'],
      where: {
        account,
        ...(where.orderId ? { orderId: { in: where.orderId } } : {}),
        ...(where.from || where.to
          ? {
              createdAt: {
                ...(where.from ? { gte: where.from } : {}),
                ...(where.to ? { lt: where.to } : {}),
              },
            }
          : {}),
      },
      _sum: { amountMinor: true },
    });

    const pick = (dir: 'debit' | 'credit') =>
      rows.find((row) => row.direction === dir)?._sum.amountMinor ?? 0n;

    return { debit: pick('debit'), credit: pick('credit') };
  }
}
