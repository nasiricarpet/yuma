import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import { Prisma } from '@yuma/db';
import type { UserRole } from '@yuma/types';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit-log/audit.service';
import { faMessages } from '../../common/messages.fa';
import { SUPPORT_QUEUE, SUPPORT_SLA_JOB } from './jobs/sla.processor';
import type {
  TicketCategory,
  TicketPriority,
} from './dto/create-ticket.dto';
import type { TicketStatus } from './dto/list-tickets.dto';

/**
 * نقش‌هایی که مجازند تیکت دریافت و پاسخ‌دهی کنند.
 *
 * `admin` و `manager` دسترسی کامل دارند؛ `support` تیم خط‌مقدم است و
 * `expert` نیز می‌تواند پیام‌های تخصصی بدهد.
 */
export const SUPPORT_ROLES: UserRole[] = ['admin', 'manager', 'support', 'expert'];

/**
 * مهلت پاسخ اولیه بر اساس اولویت — به میلی‌ثانیه.
 *
 * SLA از لحظه‌ی ثبت تیکت شروع می‌شود و نقض آن توسط SLAJob هشدار داده می‌شود.
 */
export const SLA_DEADLINES_MS: Record<TicketPriority, number> = {
  urgent: 60 * 60 * 1_000, // ۱ ساعت
  high: 4 * 60 * 60 * 1_000, // ۴ ساعت
  medium: 8 * 60 * 60 * 1_000, // ۸ ساعت
  low: 24 * 60 * 60 * 1_000, // ۲۴ ساعت
};

/** برچسب فارسی دسته‌بندی تیکت — برای پاسخ API و پنل */
export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  order_issue: 'مشکل سفارش',
  payment_issue: 'مشکل پرداخت',
  delivery_issue: 'مشکل تحویل',
  quality_issue: 'کیفیت شست‌وشو',
  account_issue: 'مشکل حساب کاربری',
  other: 'سایر',
};

/** برچسب فارسی اولویت تیکت */
export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  urgent: 'فوری',
};

/** برچسب فارسی وضعیت تیکت */
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'باز',
  pending_agent: 'در حال پیگیری',
  resolved: 'حل‌شده',
  closed: 'بسته‌شده',
};

/**
 * گذارهای مجاز وضعیت تیکت — هر کلید لیست وضعیت‌های بعدی مجاز است.
 * `closed` حالت پایانی است و بازگشتی ندارد.
 */
const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ['pending_agent', 'resolved', 'closed'],
  pending_agent: ['resolved', 'closed'],
  resolved: ['closed', 'open'],
  closed: [],
};

/** include مشترک جزئیات تیکت — پیام‌ها به‌ترتیب زمانی، همراه فرستنده */
const TICKET_INCLUDE = {
  order: { select: { id: true, trackingCode: true } },
  customer: { select: { id: true, fullName: true, mobile: true } },
  assignedTo: { select: { id: true, fullName: true, mobile: true } },
  messages: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      senderUser: { select: { id: true, fullName: true, role: true } },
    },
  },
} satisfies Prisma.SupportTicketInclude;

/**
 * سرویس تیکت‌های پشتیبانی
 *
 * دو نما دارد: نماى مشتری (`/tickets`) که فقط تیکت‌های خودش و پیام‌های
 * عمومی را می‌بیند، و نماى پشتیبان (`/admin/support/tickets`) که
 * تخصیص، تغییر وضعیت و پیام داخلی را مدیریت می‌کند.
 *
 * مهلت پاسخ اولیه (SLA) هنگام ثبت محاسبه و در `slaDueAt` ذخیره می‌شود؛
 * یک job تاخیرشده در صف `support` در زمان مقرر برای بررسی نقض قرار می‌گیرد.
 */
@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(SUPPORT_QUEUE)
    private readonly supportQueue: Queue,
  ) {}

  /* ---------------------------------------------------------------------- */
  /*                                نماى مشتری                              */
  /* ---------------------------------------------------------------------- */

  /**
   * ثبت تیکت توسط مشتری — مسیر POST /tickets
   *
   * تیکت + اولین پیام آن در یک تراکنش نوشته می‌شوند، مهلت SLA بر اساس
   * اولویت محاسبه شده و یک job تاخیرشده برای هشدار نقض در صف قرار می‌گیرد.
   *
   * @throws NotFoundException سفارش ارسال‌شده وجود نداشته باشد
   */
  async createTicket(
    customerId: string,
    dto: {
      subject: string;
      category: TicketCategory;
      priority?: TicketPriority;
      orderId?: string;
      body: string;
    },
  ) {
    const priority: TicketPriority = dto.priority ?? 'medium';
    const slaDueAt = new Date(Date.now() + SLA_DEADLINES_MS[priority]);

    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        select: { id: true, customerId: true },
      });

      if (!order) {
        throw new NotFoundException(faMessages.order.notFound);
      }

      if (order.customerId !== customerId) {
        // سفارش متعلق به مشتری دیگری است — جزئیاتش فاش نشود
        throw new NotFoundException(faMessages.order.notFound);
      }
    }

    const ticket = await this.prisma.supportTicket.create({
      data: {
        customerId,
        orderId: dto.orderId ?? null,
        category: dto.category,
        priority,
        subject: dto.subject,
        slaDueAt,
        status: 'open',
        messages: {
          create: {
            body: dto.body,
            visibility: 'public',
            senderUserId: customerId,
          },
        },
      },
      include: TICKET_INCLUDE,
    });

    // job تاخیرشده‌ی بررسی SLA — در زمان مقرر اجرا می‌شود.
    // شکست enqueue جریان ثبت را خراب نمی‌کند؛ بررسی دوره‌ای هم وجود دارد.
    await this.enqueueSlaCheck(ticket.id, slaDueAt).catch((error) => {
      this.logger.error(
        `ثبت job بررسی SLA ناموفق — ticketId: ${ticket.id} | ${String(error)}`,
      );
    });

    await this.audit.log(
      'create',
      'support_ticket',
      ticket.id,
      undefined,
      { subject: ticket.subject, category: ticket.category, priority },
      { actorId: customerId, actorRole: 'customer' },
    );

    return ticket;
  }

  /**
   * لیست تیکت‌های مشتری — مسیر GET /tickets
   *
   * فقط تیکت‌های خود مشتری برگردانده می‌شوند و پیام‌های داخلی شامل نمی‌شوند.
   */
  async listCustomerTickets(
    customerId: string,
    params: {
      page?: number;
      limit?: number;
      status?: TicketStatus;
      category?: string;
      search?: string;
    },
  ) {
    const { where, page, limit, skip } = this.buildListWhere({
      ...params,
      customerId,
    });

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, trackingCode: true } },
          assignedTo: { select: { id: true, fullName: true } },
          messages: {
            where: { visibility: 'public' },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return this.paginate(items, total, page, limit);
  }

  /**
   * جزئیات تیکت مشتری — مسیر GET /tickets/:id
   *
   * تیکت متعلق به مشتری دیگری یافت نمی‌شود تا شناسه‌ها فاش نشوند.
   * پیام‌های داخلی پشتیبان در این نما فیلتر می‌شوند.
   *
   * @throws NotFoundException تیکت وجود نداشته یا متعلق به مشتری نباشد
   */
  async getCustomerTicket(customerId: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: TICKET_INCLUDE,
    });

    if (!ticket || ticket.customerId !== customerId) {
      throw new NotFoundException(faMessages.support.ticketNotFound);
    }

    // مشتری نباید پیام‌های داخلی پشتیبان را ببیند
    return {
      ...ticket,
      messages: ticket.messages.filter((m) => m.visibility === 'public'),
    };
  }

  /**
   * ثبت پیام توسط مشتری — مسیر POST /tickets/:id/messages
   *
   * تیکت حل‌شده با پیام جدید مشتری مجدداً باز می‌شود. پاسخ اولیه
   * (`firstResponseAt`) فقط با پاسخ پشتیبان پر می‌شود.
   *
   * @throws NotFoundException تیکت وجود نداشته یا بسته‌شده باشد
   */
  async addCustomerMessage(
    customerId: string,
    ticketId: string,
    body: string,
  ) {
    const ticket = await this.getCustomerTicket(customerId, ticketId);

    if (ticket.status === 'closed') {
      throw new BadRequestException(faMessages.support.ticketClosed);
    }

    const reopen = ticket.status === 'resolved';

    const message = await this.prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderUserId: customerId,
        visibility: 'public',
        body,
      },
      include: {
        senderUser: { select: { id: true, fullName: true, role: true } },
      },
    });

    if (reopen) {
      await this.prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { status: 'open', resolvedAt: null },
      });
    }

    return message;
  }

  /* ---------------------------------------------------------------------- */
  /*                                نمای پشتیبان                            */
  /* ---------------------------------------------------------------------- */

  /**
   * لیست تیکت‌ها برای پشتیبان — مسیر GET /admin/support/tickets
   *
   * برخلاف نمای مشتری، پیام‌های داخلی و فیلترهای تخصیص/SLA در دسترس‌اند.
   */
  async listAgentTickets(
    params: {
      page?: number;
      limit?: number;
      status?: TicketStatus;
      category?: string;
      priority?: string;
      unassigned?: string;
      slaBreached?: string;
      search?: string;
    } = {},
  ) {
    const { where, page, limit, skip } = this.buildListWhere(params);

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          order: { select: { id: true, trackingCode: true } },
          customer: { select: { id: true, fullName: true, mobile: true } },
          assignedTo: { select: { id: true, fullName: true } },
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return this.paginate(items, total, page, limit);
  }

  /**
   * جزئیات تیکت برای پشتیبان — مسیر GET /admin/support/tickets/:id
   *
   * شامل پیام‌های داخلی و نام کامل مشتری/پشتیبان است.
   *
   * @throws NotFoundException تیکت وجود نداشته باشد
   */
  async getAgentTicket(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: TICKET_INCLUDE,
    });

    if (!ticket) {
      throw new NotFoundException(faMessages.support.ticketNotFound);
    }

    return ticket;
  }

  /**
   * تخصیص تیکت به پشتیبان — مسیر PATCH /admin/support/tickets/:id/assign
   *
   * @throws NotFoundException تیکت یا پشتیبان وجود نداشته باشد
   * @throws BadRequestException کاربر مشخص‌شده نقش پشتیبانی نداشته باشد
   */
  async assignTicket(
    ticketId: string,
    assignedToId: string,
    actorId: string,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, assignedToId: true, status: true },
    });

    if (!ticket) {
      throw new NotFoundException(faMessages.support.ticketNotFound);
    }

    const agent = await this.prisma.user.findUnique({
      where: { id: assignedToId },
      select: { id: true, fullName: true, role: true, isActive: true },
    });

    if (!agent) {
      throw new NotFoundException(faMessages.support.agentNotFound);
    }

    if (!SUPPORT_ROLES.includes(agent.role as UserRole)) {
      throw new BadRequestException(faMessages.support.notSupportAgent);
    }

    if (!agent.isActive) {
      throw new BadRequestException(faMessages.support.agentInactive);
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId,
        // تیکت باز پس از تخصیص در حال پیگیری می‌شود
        status: ticket.status === 'open' ? 'pending_agent' : undefined,
      },
      include: TICKET_INCLUDE,
    });

    await this.audit.log(
      'update',
      'support_ticket',
      ticketId,
      { assignedToId: ticket.assignedToId },
      { assignedToId },
      { actorId, actorRole: 'admin' },
    );

    this.logger.log(
      `تیکت تخصیص یافت — ticketId: ${ticketId} | agent: ${agent.fullName}`,
    );

    return updated;
  }

  /**
   * تغییر وضعیت تیکت — مسیر PATCH /admin/support/tickets/:id/status
   *
   * گذارها در `ALLOWED_TRANSITIONS` محدود شده‌اند. `resolved` زمان حل و
   * `closed` زمان بسته‌شدن را ثبت می‌کند.
   *
   * @throws NotFoundException تیکت وجود نداشته باشد
   * @throws BadRequestException گذار مجاز نباشد
   */
  async updateStatus(
    ticketId: string,
    status: TicketStatus,
    actorId: string,
    satisfaction?: number,
    byCustomer = false,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true, resolvedAt: true },
    });

    if (!ticket) {
      throw new NotFoundException(faMessages.support.ticketNotFound);
    }

    if (ticket.status === status) {
      return this.getAgentTicket(ticketId);
    }

    const allowed = ALLOWED_TRANSITIONS[ticket.status];
    if (!allowed.includes(status)) {
      this.logger.warn(
        `گذار غیرمجاز — ticketId: ${ticketId} | ${ticket.status} → ${status}`,
      );
      throw new BadRequestException(faMessages.support.invalidTransition);
    }

    // امتیاز رضایت فقط با بستن تیکت توسط مشتری ثبت می‌شود
    const satisfactionValue =
      byCustomer && status === 'closed' && satisfaction
        ? Math.min(5, Math.max(1, satisfaction))
        : undefined;

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status,
        resolvedAt: status === 'resolved' ? new Date() : null,
        satisfaction: satisfactionValue,
      },
      include: TICKET_INCLUDE,
    });

    await this.audit.log(
      'status-change',
      'support_ticket',
      ticketId,
      { status: ticket.status },
      { status, satisfaction: satisfactionValue ?? null },
      { actorId, actorRole: byCustomer ? 'customer' : 'admin' },
    );

    return updated;
  }

  /**
   * ثبت پاسخ پشتیبان — مسیر POST /admin/support/tickets/:id/messages
   *
   * اولین پاسخ پشتیبان، `firstResponseAt` را پر می‌کند (معیار رعایت SLA).
   * پاسخ به تیکت باز، وضعیت را به `pending_agent` تغییر می‌دهد.
   *
   * @throws NotFoundException تیکت وجود نداشته باشد
   */
  async addAgentMessage(
    agentId: string,
    ticketId: string,
    body: string,
    visibility: 'public' | 'internal' = 'public',
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true, firstResponseAt: true },
    });

    if (!ticket) {
      throw new NotFoundException(faMessages.support.ticketNotFound);
    }

    if (ticket.status === 'closed') {
      throw new BadRequestException(faMessages.support.ticketClosed);
    }

    const message = await this.prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderUserId: agentId,
        visibility,
        body,
      },
      include: {
        senderUser: { select: { id: true, fullName: true, role: true } },
      },
    });

    // اولین پاسخ پشتیبان — معیار رعایت SLA
    const firstResponse =
      ticket.firstResponseAt === null
        ? { firstResponseAt: new Date() }
        : {};

    await this.prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        ...firstResponse,
        // پاسخ عمومی به تیکت باز یعنی در حال پیگیری است
        status:
          visibility === 'public' && ticket.status === 'open'
            ? 'pending_agent'
            : undefined,
      },
    });

    return message;
  }

  /* ---------------------------------------------------------------------- */
  /*                                  بررسی SLA                             */
  /* ---------------------------------------------------------------------- */

  /**
   * هشدار نقض SLA برای یک تیکت — توسط پردازشگر صف فراخوانی می‌شود
   *
   * تیکت هنوز بدون پاسخ پشتیبان و مهلتش گذشته باشد، یک یادداشت داخلی
   * ثبت شده و رویداد `support.sla.breached` انتشار می‌یابد.
   *
   * @returns true اگر نقض واقعی بود و هشدار داده شد
   */
  async alertSlaBreach(ticketId: string): Promise<boolean> {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        subject: true,
        priority: true,
        status: true,
        slaDueAt: true,
        firstResponseAt: true,
        assignedToId: true,
      },
    });

    if (!ticket) return false;

    // پاسخ داده شده یا بسته شده — نقضی در کار نیست
    if (ticket.firstResponseAt !== null) return false;
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      return false;
    }
    if (ticket.slaDueAt === null || ticket.slaDueAt > new Date()) return false;

    this.logger.warn(
      `نقض SLA — ticketId: ${ticket.id} | موضوع: ${ticket.subject} | اولویت: ${ticket.priority}`,
    );

    // یادداشت داخلی — مشتری آن را نمی‌بیند
    await this.prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderUserId: null,
        visibility: 'internal',
        body: `هشدار خودکار: مهلت پاسخ اولیه (${TICKET_PRIORITY_LABELS[ticket.priority]}) نقض شد.`,
      },
    });

    await this.eventEmitter.emit('support.sla.breached', {
      ticketId: ticket.id,
      subject: ticket.subject,
      priority: ticket.priority,
      slaDueAt: ticket.slaDueAt,
      assignedToId: ticket.assignedToId,
    });

    return true;
  }

  /**
   * بررسی دوره‌ای همه‌ی تیکت‌های سررسید‌شده — job اسکن SLA
   *
   * تیکت‌های باز بدون پاسخ که مهلتشان گذشته شناسایی و برای هرکدام
   * هشدار صادر می‌شود. تعداد هشدارهای صادرشده برمی‌گردد.
   */
  async checkBreachedTickets(): Promise<number> {
    const breached = await this.prisma.supportTicket.findMany({
      where: {
        firstResponseAt: null,
        slaDueAt: { lt: new Date() },
        status: { in: ['open', 'pending_agent'] },
      },
      select: { id: true },
    });

    let alerted = 0;
    for (const { id } of breached) {
      const ok = await this.alertSlaBreach(id).catch((error) => {
        this.logger.error(
          `هشدار نقض SLA ناموفق — ticketId: ${id} | ${String(error)}`,
        );
        return false;
      });
      if (ok) alerted += 1;
    }

    if (alerted > 0) {
      this.logger.warn(`اسکن SLA — ${alerted} تیکت سررسید‌شده بدون پاسخ`);
    }

    return alerted;
  }

  /**
   * قرار دادن job تاخیرشده‌ی بررسی SLA در صف
   *
   * تاخیر تا `slaDueAt` است؛ اگر مهلت گذشته باشد (نباید باشد) job فورا اجرا می‌شود.
   */
  private async enqueueSlaCheck(ticketId: string, slaDueAt: Date) {
    const delay = Math.max(0, slaDueAt.getTime() - Date.now());

    await this.supportQueue.add(
      SUPPORT_SLA_JOB,
      { ticketId },
      { delay, jobId: `sla:${ticketId}`, removeOnComplete: true },
    );
  }

  /**
   * ساخت شرط `where` و سطرهای صفحه‌بندی برای هر دو نمای لیست
   *
   * جستجو روی موضوع و کد پیگیری سفارش اعمال می‌شود. `customerId` فقط
   * در نمای مشتری پر می‌شود تا دامنه‌ی نتایج محدود شود.
   */
  private buildListWhere(params: {
    page?: number;
    limit?: number;
    customerId?: string;
    status?: TicketStatus;
    category?: string;
    priority?: string;
    unassigned?: string;
    slaBreached?: string;
    search?: string;
  }) {
    const page = Math.max(1, Number(params.page ?? 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit ?? 20) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.SupportTicketWhereInput = {};

    if (params.customerId) where.customerId = params.customerId;
    if (params.status) where.status = params.status;
    if (params.category) where.category = params.category as TicketCategory;
    if (params.priority) where.priority = params.priority as TicketPriority;

    if (params.unassigned === 'true') {
      where.assignedToId = null;
    }

    if (params.slaBreached === 'true') {
      // مهلت گذشته و هنوز پاسخ پشتیبان نرسیده
      where.firstResponseAt = null;
      where.slaDueAt = { lt: new Date() };
      where.status = { notIn: ['resolved', 'closed'] };
    }

    if (params.search && params.search.trim()) {
      const term = params.search.trim();
      where.OR = [
        { subject: { contains: term, mode: 'insensitive' } },
        { order: { trackingCode: { contains: term, mode: 'insensitive' } } },
      ];
    }

    return { where, page, limit, skip };
  }

  /** ساخت بدنه‌ی صفحه‌بندی مشترک با `totalPages` */
  private paginate<T>(items: T[], total: number, page: number, limit: number) {
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
