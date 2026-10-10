import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@yuma/db';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit-log/audit.service';
import { faMessages } from '../../common/messages.fa';

/** برچسب فارسی وضعیت تسویه — برای پاسخ API */
export const SETTLEMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت‌شده',
};

/** ساختار خروجی محاسبه‌ی تسویه‌ی یک دوره */
export interface SettlementCalculation {
  workshopId: string;
  periodStart: Date;
  periodEnd: Date;
  grossMinor: bigint;
  commissionMinor: bigint;
  netPayableMinor: bigint;
}

/**
 * سرویس تسویه‌ی دوره‌ای کارگاه‌ها
 *
 * سهم کارگاه از پرداخت‌های موفق در قلم `workshop_payable` دفتر کل
 * ثبت شده است؛ این سرویس آن قلم‌ها را برای یک دوره جمع کرده و
 * یک ردیف تسویه می‌سازد و سپس می‌تواند آن را «پرداخت‌شده» علامت بزند.
 */
@Injectable()
export class SettlementsService {
  private readonly logger = new Logger(SettlementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * محاسبه‌ی تسویه‌ی یک ماه برای یک کارگاه
   *
   * @param workshopId شناسه‌ی کارگاه (Laundry)
   * @param month      دوره به فرمت ISO `YYYY-MM` (ماه میلادی)
   *
   * gross = جمع کل پرداخت‌های کارگاه در دوره (کارمزد + سهم کارگاه)
   * commission = کارمزد پلتفرم
   * netPayable = gross − commission = سهم خالص کارگاه
   */
  async calculateMonthly(
    workshopId: string,
    month: string,
  ): Promise<SettlementCalculation> {
    const { periodStart, periodEnd } = this.parseMonth(month);

    // قلم‌های کارگاه در دوره — قلم‌ها از طریق سفارش به کارگاه وصل می‌شوند
    const rows = await this.prisma.ledgerEntry.findMany({
      where: {
        createdAt: { gte: periodStart, lt: periodEnd },
        order: { laundryId: workshopId },
      },
      select: { account: true, direction: true, amountMinor: true },
    });

    const workshopShare = rows
      .filter((row) => row.account === 'workshop_payable' && row.direction === 'credit')
      .reduce((sum, row) => sum + row.amountMinor, 0n);
    const commission = rows
      .filter((row) => row.account === 'platform_revenue' && row.direction === 'credit')
      .reduce((sum, row) => sum + row.amountMinor, 0n);

    const calculation: SettlementCalculation = {
      workshopId,
      periodStart,
      periodEnd,
      grossMinor: workshopShare + commission,
      commissionMinor: commission,
      netPayableMinor: workshopShare,
    };

    // ثبت/upsert ردیف تسویه — هر کارگاه در هر دوره فقط یک ردیف دارد.
    // اگر قبلاً پرداخت‌شده باشد، محاسبه دوباره روی آن اعمال نمی‌شود.
    await this.prisma.workshopSettlement.upsert({
      where: {
        workshopId_periodStart_periodEnd: {
          workshopId,
          periodStart,
          periodEnd,
        },
      },
      create: {
        workshopId,
        periodStart,
        periodEnd,
        grossMinor: calculation.grossMinor,
        commissionMinor: calculation.commissionMinor,
        netPayableMinor: calculation.netPayableMinor,
        status: 'pending',
      },
      update: {
        grossMinor: calculation.grossMinor,
        commissionMinor: calculation.commissionMinor,
        netPayableMinor: calculation.netPayableMinor,
      },
    });

    return calculation;
  }

  /**
   * علامت‌گذاری تسویه به‌عنوان پرداخت‌شده
   *
   * @param id        شناسه‌ی ردیف تسویه
   * @param reference مرجع پرداخت بانکی (شناسه‌ی حواله یا فیش)
   * @param actorId   کاربری که پرداخت را تأیید کرده — برای ممیزی
   * @throws NotFoundException تسویه وجود نداشته باشد
   * @throws BadRequestException تسویه قبلاً پرداخت شده باشد
   */
  async markPaid(
    id: string,
    reference?: string,
    actorId?: string,
  ): Promise<{ id: string; status: string }> {
    const settlement = await this.prisma.workshopSettlement.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        workshopId: true,
        periodStart: true,
        netPayableMinor: true,
      },
    });

    if (!settlement) {
      throw new NotFoundException(faMessages.common.notFound);
    }

    if (settlement.status === 'paid') {
      throw new BadRequestException('این تسویه قبلاً پرداخت شده است');
    }

    const updated = await this.prisma.workshopSettlement.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        reference: reference ?? null,
      },
      select: { id: true, status: true },
    });

    // ثبت رویداد مالی در ممیزی — عمل پرداخت تسویه قابل ردیابی باشد
    await this.audit.log(
      'update',
      'workshop_settlement',
      id,
      { status: settlement.status, netPayableMinor: settlement.netPayableMinor.toString() },
      { status: 'paid', reference: reference ?? null },
      { actorId: actorId ?? null, actorRole: 'admin' },
    );

    this.logger.log(
      `تسویه پرداخت شد — settlementId: ${id} | کارگاه: ${settlement.workshopId} | دوره: ${settlement.periodStart.toISOString()}`,
    );

    return updated;
  }

  /**
   * تبدیل `YYYY-MM` به بازه‌ی زمانی — شروع ماه و شروع ماه بعد (انحصاری)
   */
  private parseMonth(month: string): { periodStart: Date; periodEnd: Date } {
    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match) {
      throw new BadRequestException('فرمت ماه نامعتبر است — باید YYYY-MM باشد');
    }

    const year = Number(match[1]);
    const monthIndex = Number(match[2]);

    if (monthIndex < 1 || monthIndex > 12) {
      throw new BadRequestException('ماه نامعتبر است — باید بین ۰۱ و ۱۲ باشد');
    }

    const periodStart = new Date(Date.UTC(year, monthIndex - 1, 1));
    const periodEnd = new Date(Date.UTC(year, monthIndex, 1));

    return { periodStart, periodEnd };
  }

  /**
   * لیست صفحه‌بندی‌شده‌ی تسویه‌ها با فیلتر — جدیدترین دوره‌ها اول
   */
  async list(params: {
    page?: number;
    limit?: number;
    workshopId?: string;
    status?: string;
    month?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.WorkshopSettlementWhereInput = {};
    if (params.workshopId) where.workshopId = params.workshopId;
    if (params.status === 'pending' || params.status === 'paid') {
      where.status = params.status;
    }
    if (params.month) {
      const { periodStart, periodEnd } = this.parseMonth(params.month);
      where.periodStart = periodStart;
      where.periodEnd = periodEnd;
    }

    const [items, total] = await Promise.all([
      this.prisma.workshopSettlement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { periodStart: 'desc' },
        include: {
          workshop: { select: { id: true, name: true, city: true } },
        },
      }),
      this.prisma.workshopSettlement.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }
}
