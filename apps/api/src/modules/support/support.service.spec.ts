import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SupportService, SLA_DEADLINES_MS } from './support.service';

/** برش فیلدهای یک ردیف بر اساس شرط select */
function pick(row: any, select: any) {
  if (!select) return row;
  return Object.fromEntries(Object.keys(select).map((key) => [key, row[key]]));
}

/**
 * Prisma جعلی — فقط متدهایی که سرویس فراخوانی می‌کند پیاده‌سازی شده‌اند.
 * تیکت‌ها و پیام‌ها روی Mapهای درون‌حافظه‌ای نگه داشته می‌شوند تا
 * تراکنشِ ثبت تیکت+پیام و فیلترهای لیست به‌صورت واقعی شبیه‌سازی شوند.
 */
function createPrismaMock() {
  const tickets = new Map<string, any>();
  const messages = new Map<string, any>();
  const users = new Map<string, any>();
  const orders = new Map<string, any>();
  let ticketSeq = 0;
  let messageSeq = 0n;
  const now = new Date('2026-10-10T08:00:00Z');

  const senderOf = (id: string | null) =>
    id ? { id, fullName: users.get(id)?.fullName ?? 'کاربر', role: users.get(id)?.role ?? 'customer' } : null;

  /** اعمال شرط include روی یک ردیف — پیام‌های تیکت و joinهای ساده */
  const withInclude = (row: any, include: any) => {
    if (!include) return row;
    const out: any = { ...row };
    if (include.messages) {
      let msgs = [...messages.values()]
        .filter((m) => m.ticketId === row.id)
        .sort((a, b) => a.createdAt - b.createdAt);
      if (include.messages.where?.visibility)
        msgs = msgs.filter((m) => m.visibility === include.messages.where.visibility);
      if (include.messages.take) msgs = msgs.slice(0, include.messages.take);
      out.messages = msgs.map((m) => ({ ...m, senderUser: senderOf(m.senderUserId) }));
    }
    if (include.order) out.order = row.orderId ? { id: row.orderId, trackingCode: 'TC-1' } : null;
    if (include.customer) out.customer = { id: row.customerId, fullName: 'مشتری تست', mobile: '09120000000' };
    if (include.assignedTo)
      out.assignedTo = row.assignedToId ? { id: row.assignedToId, fullName: 'پشتیبان تست' } : null;
    return out;
  };

  const supportTicket = {
    create: jest.fn(async ({ data, include }: any) => {
      const id = `ticket-${++ticketSeq}`;
      const row: any = {
        id,
        status: 'open',
        priority: 'medium',
        resolvedAt: null,
        firstResponseAt: null,
        satisfaction: null,
        assignedToId: null,
        createdAt: now,
        updatedAt: now,
        ...data,
      };
      tickets.set(id, row);
      // پیامِ همراهِ ثبت تیکت (nested create)
      if (data.messages?.create) {
        const mid = `msg-${++messageSeq}`;
        const msg = {
          id: mid,
          ticketId: id,
          createdAt: now,
          ...data.messages.create,
        };
        messages.set(mid, msg);
      }
      return withInclude(row, include);
    }),
    findUnique: jest.fn(async ({ where, select, include }: any) => {
      const row = tickets.get(where.id) ?? null;
      if (!row) return null;
      if (select) return pick(row, select);
      return withInclude(row, include);
    }),
    findMany: jest.fn(async ({ where, skip, take, orderBy, select }: any = {}) => {
      let items = [...tickets.values()];
      if (where?.customerId) items = items.filter((t) => t.customerId === where.customerId);
      if (where?.status) items = items.filter((t) => t.status === where.status);
      if (where?.category) items = items.filter((t) => t.category === where.category);
      if (where?.priority) items = items.filter((t) => t.priority === where.priority);
      if (where?.assignedToId === null)
        items = items.filter((t) => t.assignedToId === null);
      if (where?.firstResponseAt === null)
        items = items.filter((t) => t.firstResponseAt === null);
      if (where?.slaDueAt?.lt)
        items = items.filter((t) => t.slaDueAt !== null && t.slaDueAt < where.slaDueAt.lt);
      if (where?.status?.notIn)
        items = items.filter((t) => !where.status.notIn.includes(t.status));
      if (orderBy?.createdAt === 'desc')
        items.sort((a, b) => b.createdAt - a.createdAt);
      const start = typeof skip === 'number' ? skip : 0;
      const end = typeof take === 'number' ? start + take : items.length;
      items = items.slice(start, end);
      if (select) return items.map((t) => pick(t, select));
      return items.map((t) => withInclude(t, { messages: true }));
    }),
    count: jest.fn(async ({ where }: any = {}) => {
      let items = [...tickets.values()];
      if (where?.customerId) items = items.filter((t) => t.customerId === where.customerId);
      if (where?.status) items = items.filter((t) => t.status === where.status);
      if (where?.firstResponseAt === null)
        items = items.filter((t) => t.firstResponseAt === null);
      if (where?.slaDueAt?.lt)
        items = items.filter((t) => t.slaDueAt !== null && t.slaDueAt < where.slaDueAt.lt);
      if (where?.status?.notIn)
        items = items.filter((t) => !where.status.notIn.includes(t.status));
      return items.length;
    }),
    update: jest.fn(async ({ where, data, include }: any) => {
      const row = tickets.get(where.id);
      const merged = { ...row, ...data, updatedAt: new Date() };
      tickets.set(where.id, merged);
      return withInclude(merged, include);
    }),
  };

  const supportMessage = {
    create: jest.fn(async ({ data, include }: any) => {
      const id = `msg-${++messageSeq}`;
      const row: any = {
        id,
        ticketId: data.ticketId,
        createdAt: now,
        ...data,
      };
      messages.set(id, row);
      if (include?.senderUser) row.senderUser = senderOf(data.senderUserId);
      return row;
    }),
  };

  const user = {
    findUnique: jest.fn(async ({ where, select }: any) => {
      const row = users.get(where.id) ?? null;
      if (!row) return null;
      return pick(row, select);
    }),
  };

  const order = {
    findUnique: jest.fn(async ({ where, select }: any) => {
      const row = orders.get(where.id) ?? null;
      if (!row) return null;
      return pick(row, select);
    }),
  };

  return {
    supportTicket,
    supportMessage,
    user,
    order,
    _tickets: tickets,
    _messages: messages,
    _users: users,
    _orders: orders,
  };
}

/** ساخت AuditService جعلی — فقط log ثبت می‌کند */
function createAuditMock() {
  return { log: jest.fn(async () => ({})) };
}

/** ساخت صف جعلی — add فراخوانی‌ها برای بررسی SLA ثبت می‌شوند */
function createQueueMock() {
  return { add: jest.fn(async (..._args: unknown[]) => ({})) };
}

describe('SupportService', () => {
  let service: SupportService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let audit: ReturnType<typeof createAuditMock>;
  let queue: ReturnType<typeof createQueueMock>;
  let events: EventEmitter2;
  const customerId = 'customer-1';
  const agentId = 'agent-1';

  beforeEach(() => {
    prisma = createPrismaMock();
    audit = createAuditMock();
    queue = createQueueMock();
    events = new EventEmitter2();
    service = new SupportService(
      prisma as never,
      audit as never,
      events,
      queue as never,
    );

    prisma._users.set(customerId, {
      id: customerId,
      fullName: 'مشتری تست',
      role: 'customer',
      isActive: true,
    });
    prisma._users.set(agentId, {
      id: agentId,
      fullName: 'پشتیبان تست',
      role: 'support',
      isActive: true,
    });
  });

  /* -------------------------------------------------------------------- */

  it('۱. تیکت مشتری را با اولین پیام و مهلت SLA بر اساس اولویت ثبت می‌کند', async () => {
    const before = Date.now();

    const ticket = await service.createTicket(customerId, {
      subject: 'فرش هنوز تحویل نشده',
      category: 'delivery_issue',
      priority: 'urgent',
      body: 'زمان تحویل گذشته ولی خبری نیست.',
    });

    expect(ticket.id).toBe('ticket-1');
    expect(ticket.status).toBe('open');
    expect(ticket.priority).toBe('urgent');
    // اولین پیام هم‌زمان با تیکت نوشته شده
    expect(prisma._messages.size).toBe(1);
    const msg = [...prisma._messages.values()][0];
    expect(msg.body).toBe('زمان تحویل گذشته ولی خبری نیست.');
    expect(msg.visibility).toBe('public');
    expect(msg.senderUserId).toBe(customerId);

    // مهلت SLA بر اساس اولویت urgent = ۱ ساعت
    expect(ticket.slaDueAt).not.toBeNull();
    const delta = (ticket.slaDueAt as Date).getTime() - before;
    expect(delta).toBeGreaterThanOrEqual(SLA_DEADLINES_MS.urgent - 500);
    expect(delta).toBeLessThan(SLA_DEADLINES_MS.urgent + 60_000);

    // job بررسی SLA با تاخیر تا slaDueAt در صف قرار گرفته
    expect(queue.add).toHaveBeenCalledTimes(1);
    const [name, data, opts] = queue.add.mock.calls[0] as [
      string,
      { ticketId: string },
      { delay: number; jobId: string },
    ];
    expect(name).toBe('support:check-sla');
    expect(data).toEqual({ ticketId: ticket.id });
    expect(opts.jobId).toBe(`sla:${ticket.id}`);
    expect(opts.delay).toBeGreaterThanOrEqual(SLA_DEADLINES_MS.urgent - 500);

    // رویداد ثبت در گزارش ممیزی نوشته شده
    expect(audit.log).toHaveBeenCalledWith(
      'create',
      'support_ticket',
      ticket.id,
      undefined,
      expect.objectContaining({
        subject: 'فرش هنوز تحویل نشده',
        category: 'delivery_issue',
        priority: 'urgent',
      }),
      expect.objectContaining({ actorId: customerId, actorRole: 'customer' }),
    );
  });

  it('۲. مشتری پیام‌های داخلی را نمی‌بیند و به تیکت دیگری دسترسی ندارد', async () => {
    prisma._tickets.set('ticket-x', {
      id: 'ticket-x',
      customerId: 'customer-2',
      orderId: null,
      category: 'other',
      priority: 'low',
      status: 'open',
      subject: 'تیکت مشتری دیگر',
      slaDueAt: new Date(),
      firstResponseAt: null,
      resolvedAt: null,
      satisfaction: null,
      assignedToId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // تیکت مشتری دیگر → NotFound (جزئیات فاش نمی‌شود)
    await expect(
      service.getCustomerTicket(customerId, 'ticket-x'),
    ).rejects.toBeInstanceOf(NotFoundException);

    // تیکت خود مشتری + یک پیام داخلی پشتیبان
    const mine = await service.createTicket(customerId, {
      subject: 'سوال درباره فاکتور',
      category: 'payment_issue',
      body: 'فاکتورم نیامده.',
    });
    await service.addAgentMessage(agentId, mine.id, 'بررسی مالی شروع شد.', 'internal');

    const detail = await service.getCustomerTicket(customerId, mine.id);
    expect(detail.customerId).toBe(customerId);
    // فقط پیام عمومی خود مشتری دیده می‌شود — پیام داخلی فیلتر است
    expect(detail.messages).toHaveLength(1);
    expect(detail.messages[0].body).toBe('فاکتورم نیامده.');
    expect(detail.messages[0].visibility).toBe('public');
  });

  it('۳. پیام جدید مشتری، تیکت حل‌شده را دوباره باز می‌کند', async () => {
    const ticket = await service.createTicket(customerId, {
      subject: 'مشکل کیفیت شست‌وشو',
      category: 'quality_issue',
      priority: 'high',
      body: 'لکه از بین نرفته.',
    });

    // پشتیبان پاسخ می‌دهد و تیکت حل می‌شود
    await service.addAgentMessage(agentId, ticket.id, 'دوباره شست‌وشو می‌شود.');
    await service.updateStatus(ticket.id, 'resolved', agentId);
    expect(prisma._tickets.get(ticket.id).status).toBe('resolved');
    expect(prisma._tickets.get(ticket.id).resolvedAt).not.toBeNull();

    // مشتری دوباره پیام می‌دهد → تیکت باز می‌شود و resolvedAt پاک می‌شود
    const reply = await service.addCustomerMessage(
      customerId,
      ticket.id,
      'هنوز لکه سر جاست.',
    );
    expect(reply.body).toBe('هنوز لکه سر جاست.');
    expect(reply.visibility).toBe('public');

    const after = prisma._tickets.get(ticket.id);
    expect(after.status).toBe('open');
    expect(after.resolvedAt).toBeNull();

    // پاسخ اولیه پاک نمی‌شود — معیار SLA حفظ می‌گردد
    expect(after.firstResponseAt).not.toBeNull();
  });

  it('۴. تخصیص تیکت به کاربری با نقش غیرپشتیبانی رد می‌شود', async () => {
    prisma._users.set('driver-1', {
      id: 'driver-1',
      fullName: 'راننده تست',
      role: 'driver',
      isActive: true,
    });
    const ticket = await service.createTicket(customerId, {
      subject: 'مشکل سفارش',
      category: 'order_issue',
      body: 'وضعیت سفارش نامشخص است.',
    });

    // نقش driver مجاز نیست
    await expect(
      service.assignTicket(ticket.id, 'driver-1', agentId),
    ).rejects.toBeInstanceOf(BadRequestException);

    // کاربر غیرفعال هم مجاز نیست
    prisma._users.set('inactive-1', {
      id: 'inactive-1',
      fullName: 'پشتیبان غیرفعال',
      role: 'support',
      isActive: false,
    });
    await expect(
      service.assignTicket(ticket.id, 'inactive-1', agentId),
    ).rejects.toBeInstanceOf(BadRequestException);

    // کاربر ناموجود → NotFound
    await expect(
      service.assignTicket(ticket.id, 'nobody', agentId),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma._tickets.get(ticket.id).assignedToId).toBeNull();

    // تخصیص صحیح با نقش support انجام می‌شود و تیکت باز در حال پیگیری می‌شود
    const assigned = await service.assignTicket(ticket.id, agentId, agentId);
    expect(assigned.assignedToId).toBe(agentId);
    expect(prisma._tickets.get(ticket.id).status).toBe('pending_agent');
    expect(audit.log).toHaveBeenCalledWith(
      'update',
      'support_ticket',
      ticket.id,
      { assignedToId: null },
      { assignedToId: agentId },
      expect.objectContaining({ actorId: agentId }),
    );
  });

  it('۵. گذار غیرمجاز وضعیت (از closed) رد می‌شود و resolvedAt ثبت می‌گردد', async () => {
    const ticket = await service.createTicket(customerId, {
      subject: 'سایر',
      category: 'other',
      body: 'ممنون از پشتیبانی.',
    });

    // closed یک وضعیت پایانی است — برگشتی از آن مجاز نیست
    await service.updateStatus(ticket.id, 'closed', agentId);
    await expect(
      service.updateStatus(ticket.id, 'open', agentId),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma._tickets.get(ticket.id).status).toBe('closed');

    // resolved زمان حل را ثبت می‌کند
    const ticket2 = await service.createTicket(customerId, {
      subject: 'مشکل پرداخت',
      category: 'payment_issue',
      body: 'پرداخت دو بار برداشت شد.',
    });
    const resolved = await service.updateStatus(ticket2.id, 'resolved', agentId);
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolvedAt).not.toBeNull();

    // وضعیت یکسان، آپدیت اضافی انجام نمی‌شود
    const callsBefore = prisma.supportTicket.update.mock.calls.length;
    await service.updateStatus(ticket2.id, 'resolved', agentId);
    expect(prisma.supportTicket.update.mock.calls.length).toBe(callsBefore);

    // تیکت ناموجود → NotFound
    await expect(
      service.updateStatus('nobody', 'resolved', agentId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('۶. پاسخ پشتیبان firstResponseAt را پر می‌کند و نقض SLA هشدار داده می‌شود', async () => {
    const breached: any[] = [];
    events.on('support.sla.breached', (payload) => breached.push(payload));

    const ticket = await service.createTicket(customerId, {
      subject: 'فوری: سفارش گم شده',
      category: 'order_issue',
      priority: 'urgent',
      body: 'هیچ اطلاعاتی ندارم.',
    });

    // مهلت SLA گذشته و هنوز پاسخی نرسیده → نقض
    prisma._tickets.get(ticket.id).slaDueAt = new Date('2026-10-09T08:00:00Z');

    const alerted = await service.alertSlaBreach(ticket.id);
    expect(alerted).toBe(true);

    // یک یادداشت داخلی خودکار ثبت شده — مشتری آن را نمی‌بیند
    const notes = [...prisma._messages.values()].filter((m) => m.visibility === 'internal');
    expect(notes).toHaveLength(1);
    expect(notes[0].senderUserId).toBeNull();

    // رویداد نقض انتشار یافته
    expect(breached).toHaveLength(1);
    expect(breached[0]).toEqual(
      expect.objectContaining({
        ticketId: ticket.id,
        subject: 'فوری: سفارش گم شده',
        priority: 'urgent',
      }),
    );

    // پاسخ پشتیبان اولین پاسخ را ثبت می‌کند و تیکت باز را در حال پیگیری می‌کند
    const before = Date.now();
    const reply = await service.addAgentMessage(agentId, ticket.id, 'در حال ردیابی.');
    expect(reply.visibility).toBe('public');

    const after = prisma._tickets.get(ticket.id);
    expect(after.firstResponseAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(after.status).toBe('pending_agent');

    // بعد از پاسخ، هشدار نقض دیگر صادر نمی‌شود
    const again = await service.alertSlaBreach(ticket.id);
    expect(again).toBe(false);
    expect(breached).toHaveLength(1);
  });
});
