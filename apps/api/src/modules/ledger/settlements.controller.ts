import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ListSettlementsDto } from './dto/list-settlements.dto';
import { MarkSettlementPaidDto } from './dto/mark-settlement-paid.dto';
import {
  SettlementsService,
  type SettlementCalculation,
} from './settlements.service';

/**
 * تبدیل مبالغ خردی به رشته —
 * فیلدهای `*Minor` در دیتابیس BigInt هستند و `JSON.stringify`
 * نمی‌تواند BigInt را سریال کند، پس در لایه‌ی انتقال به رشته تبدیل می‌شوند.
 * کلاینت آن‌ها را با `Number()` می‌خواند.
 */
function serializeCalculation(calc: SettlementCalculation) {
  return {
    ...calc,
    grossMinor: calc.grossMinor.toString(),
    commissionMinor: calc.commissionMinor.toString(),
    netPayableMinor: calc.netPayableMinor.toString(),
  };
}

/** تبدیل ردیف‌های تسویه — همان تبدیل BigInt به رشته برای هر ردیف */
function serializeRow<T extends Record<string, unknown>>(row: T): T {
  return {
    ...row,
    grossMinor: String(row.grossMinor),
    commissionMinor: String(row.commissionMinor),
    netPayableMinor: String(row.netPayableMinor),
  } as T;
}

/**
 * کنترلر تسویه‌ی دوره‌ای کارگاه‌ها — فقط پنل ادمین
 *
 * مسیرها:
 *  GET  /admin/settlements                  لیست صفحه‌بندی‌شده‌ی تسویه‌ها
 *  GET  /admin/settlements/preview          محاسبه‌ی زنده‌ی یک دوره بدون ذخیره
 *  POST /admin/settlements/:id/mark-paid    علامت‌گذاری به‌عنوان پرداخت‌شده
 *
 * گارد JWT و RolesGuard به صورت سراسری در AuthModule ثبت شده‌اند.
 */
@Controller('admin/settlements')
@Roles('admin')
export class SettlementsController {
  constructor(private readonly settlements: SettlementsService) {}

  /** لیست تسویه‌های ذخیره‌شده — جدیدترین دوره‌ها اول */
  @Get()
  async list(@Query() query: ListSettlementsDto) {
    const result = await this.settlements.list(query);

    return {
      ...result,
      items: result.items.map((row) => serializeRow(row)),
    };
  }

  /**
   * محاسبه‌ی زنده‌ی تسویه‌ی یک دوره — ردیف را upsert می‌کند.
   * کارگاه و ماه از کوئری خوانده می‌شوند: ?workshopId=...&month=2026-09
   */
  @Get('preview')
  async preview(
    @Query('workshopId') workshopId: string,
    @Query('month') month: string,
  ) {
    const calc = await this.settlements.calculateMonthly(workshopId, month);

    return serializeCalculation(calc);
  }

  /** علامت‌گذاری تسویه به‌عنوان پرداخت‌شده — مرجع حواله اختیاری است */
  @Post(':id/mark-paid')
  markPaid(
    @Param('id') id: string,
    @Body() body: MarkSettlementPaidDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.settlements.markPaid(id, body.reference, actorId);
  }
}
