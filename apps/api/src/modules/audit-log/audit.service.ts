import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { Prisma } from '@yuma/db';
import { PrismaService } from '../../database/prisma.service';
import type { JwtAuthUser } from '../auth/strategies/jwt.strategy';
import { ListAuditDto } from './dto/list-audit.dto';

/** نوع عمل ثبت‌شده در لاگ ممیزی */
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'change-role'
  | 'login'
  | 'logout'
  | 'status-change'
  | 'cancel';

export const AUDIT_ACTIONS: readonly AuditAction[] = [
  'create',
  'update',
  'delete',
  'change-role',
  'login',
  'logout',
  'status-change',
  'cancel',
] as const;

/** موجودیتی که عمل روی آن انجام شده */
export interface AuditEntity {
  /** نوع موجودیت: user, order, laundry, ... */
  type: string;
  /** شناسه موجودیت — برای رویدادهای سیستمی ممکن است نباشد */
  id?: string | null;
}

/**
 * اطلاعات بازیگری که عمل را انجام داده و بستر درخواست.
 * همه‌ی فیلدها اختیاری هستند چون برخی رویدادها سیستمی هستند.
 */
export interface AuditContext {
  actorId?: string | null;
  actorRole?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

/** ساختار خروجی آمار رویدادها */
export interface AuditStats {
  total: number;
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
}

/**
 * سرویس ممیزی — ثبت رویدادهای سیستمی و بازیابی آن‌ها
 *
 * ثبت ممیزی هرگز نباید جریان کاربر را مسدود کند؛ در صورت شکست،
 * خطا لاگ می‌شود و عملیات اصلی ادامه پیدا می‌کند.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * ثبت یک رویداد ممیزی
   *
   * @param action نوع عمل: create | update | delete | login | logout
   * @param entityType نوع موجودیت هدف: user, order, ...
   * @param entityId شناسه موجودیت (اختیاری)
   * @param before وضعیت موجودیت پیش از تغییر
   * @param after وضعیت موجودیت پس از تغییر
   * @param context بازیگر و اطلاعات درخواست (اختیاری)
   */
  async log(
    action: AuditAction,
    entityType: string,
    entityId?: string | null,
    before?: unknown,
    after?: unknown,
    context?: AuditContext,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: context?.actorId ?? null,
          actorRole: context?.actorRole ?? null,
          action,
          entityType,
          entityId: entityId ?? null,
          before: this.toJson(before),
          after: this.toJson(after),
          ip: context?.ip ?? null,
          userAgent: context?.userAgent ?? null,
          requestId: context?.requestId ?? null,
        },
      });
    } catch (error) {
      // شکست ثبت نباید عملیات اصلی را خراب کند
      this.logger.error(
        `ثبت ممیزی ناموفق (${action} روی ${entityType}:${entityId ?? '-'}): ${String(error)}`,
      );
    }
  }

  /**
   * ثبت ممیزی با استخراج خودکارِ بازیگر و اطلاعات درخواست از روی req
   *
   * کاربر از `req.user` (که توسط JwtStrategy پر می‌شود)، IP و User-Agent
   * از هدرها و `requestId` از هدر `x-request-id` خوانده می‌شوند.
   *
   * `context` برای زمانی است که فراخوانی مقدار دقیق‌تری از گارد دارد —
   * مثلاً مسیر ورود عمومی است و `req.user` هنوز پر نشده، یا سرویس
   * بازیگر را جداگانه دریافت کرده است. مقادیر ارسال‌شده اولویت دارند.
   *
   * `req` اختیاری است تا بتوان بدون درخاشت HTTP (مثلاً در job های زمان‌بندی‌شده)
   * تنها با `context` ثبت کرد؛ در این حالت IP و User-Agent خالی می‌مانند.
   *
   * @example
   * await this.auditService.logFromRequest(req, 'update', { type: 'user', id }, before, after);
   */
  async logFromRequest(
    req: Request | undefined | null,
    action: AuditAction,
    entity: AuditEntity,
    before?: unknown,
    after?: unknown,
    context?: Partial<AuditContext>,
  ): Promise<void> {
    const user = req?.user as JwtAuthUser | undefined;

    await this.log(action, entity.type, entity.id, before, after, {
      actorId: context?.actorId ?? user?.id ?? null,
      actorRole: context?.actorRole ?? user?.role ?? null,
      ip: context?.ip ?? req?.ip ?? null,
      userAgent: context?.userAgent ?? this.header(req, 'user-agent'),
      requestId: context?.requestId ?? this.header(req, 'x-request-id'),
    });
  }

  /** لیست صفحه‌بندی‌شده‌ی رویدادها با فیلتر — جدیدترین‌ها اول */
  async list(dto: ListAuditDto) {
    const page = Math.max(1, dto.page ?? 1);
    const limit = Math.min(100, Math.max(1, dto.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (dto.actorId) where.actorId = dto.actorId;
    if (dto.action) where.action = dto.action;
    if (dto.entityType) where.entityType = dto.entityType;
    if (dto.entityId) where.entityId = dto.entityId;

    if (dto.from || dto.to) {
      where.createdAt = {};
      if (dto.from) where.createdAt.gte = dto.from;
      if (dto.to) where.createdAt.lte = dto.to;
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * آمار رویدادها — تعداد کل و تفکیک بر اساس عمل و نوع موجودیت.
   * فیلترها مشابه `list` اعمال می‌شوند تا آمار با لیست همخوان باشد.
   */
  async stats(dto: ListAuditDto): Promise<AuditStats> {
    const where: Prisma.AuditLogWhereInput = {};

    if (dto.actorId) where.actorId = dto.actorId;
    if (dto.action) where.action = dto.action;
    if (dto.entityType) where.entityType = dto.entityType;
    if (dto.entityId) where.entityId = dto.entityId;

    if (dto.from || dto.to) {
      where.createdAt = {};
      if (dto.from) where.createdAt.gte = dto.from;
      if (dto.to) where.createdAt.lte = dto.to;
    }

    const [total, byAction, byEntityType] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { _all: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: { _all: true },
      }),
    ]);

    return {
      total,
      byAction: Object.fromEntries(
        byAction.map((r) => [r.action, r._count._all]),
      ),
      byEntityType: Object.fromEntries(
        byEntityType.map((r) => [r.entityType, r._count._all]),
      ),
    };
  }

  /**
   * خواندن یک هدر — هدرها ممکن است آرایه باشند؛
   * اولین مقدار برگردانده می‌شود تا با فیلد تک‌مقداری ممیزی همخوان باشد.
   */
  private header(
    req: Request | undefined | null,
    name: string,
  ): string | null {
    const value = req?.headers?.[name];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  }

  /**
   * تبدیل مقدار به فرمت JSON پرایسما —
   * `undefined` و `null` هر دو به SQL NULL تبدیل می‌شوند
   * (پرایسما برای فیلد JSON که قابل‌نول است فقط `Prisma.JsonNull` را قبول می‌کند، `null` خام خطا می‌دهد)
   */
  private toJson(
    value: unknown | null | undefined,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    return value === undefined || value === null
      ? Prisma.JsonNull
      : (value as Prisma.InputJsonValue);
  }
}
