import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Queue } from 'bullmq';
import { NotificationService } from './notification.service';
import { NotificationTemplatesService } from './templates.service';
import { SendSmsProcessor } from './jobs/send-sms.processor';
import { OrderNotificationListener } from './listeners/order.listener';
import { MockSmsProvider } from './providers/mock-sms.provider';
import { KavenegarProvider } from './providers/kavenegar.provider';
import { chooseSmsProvider } from './notifications.module';

/** قالب نمونه با متغیر {{trackingCode}} */
const SAMPLE_TEMPLATE = {
  id: 'tpl-1',
  code: 'order_ready',
  channel: 'sms',
  locale: 'fa',
  version: 1,
  subject: null,
  body: 'سفارش {{trackingCode}} آماده تحویل است.',
  isActive: true,
  createdAt: new Date(),
};

type PrismaMock = Record<string, Record<string, jest.Mock>>;

/** شبیه‌سازی PrismaService — فقط جدول‌های مربوط به اعلان */
function createPrismaMock(): PrismaMock {
  return {
    notification: {
      create: jest.fn(async (args: { data: Record<string, unknown> }) => ({
        id: 'notif-1',
        status: 'queued',
        ...args.data,
      })),
      update: jest.fn(async () => ({})),
      findUnique: jest.fn(async () => null),
    },
    notificationTemplate: {
      findFirst: jest.fn(async () => ({ ...SAMPLE_TEMPLATE })),
    },
    order: {
      findUnique: jest.fn(async () => null),
      update: jest.fn(async () => ({})),
    },
  };
}

describe('NotificationsModule', () => {
  // ۱) send() یک ردیف Notification با وضعیت queued می‌سازد
  it('send یک ردیف Notification با وضعیت queued می‌سازد و در صف قرار می‌دهد', async () => {
    const prisma = createPrismaMock();
    const templates = new NotificationTemplatesService(prisma as never);
    const queue = { add: jest.fn(async () => ({})) } as unknown as Queue;

    const service = new NotificationService(prisma as never, templates, queue);

    const result = await service.send(
      '09123456789',
      'order_ready',
      { trackingCode: 'YUMA-1234' },
      { userId: 'user-1', orderId: 'order-1' },
    );

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        orderId: 'order-1',
        channel: 'sms',
        templateCode: 'order_ready',
        recipient: '09123456789',
        payload: { trackingCode: 'YUMA-1234' },
        status: 'queued',
      },
    });
    expect(queue.add).toHaveBeenCalledWith(
      'send-sms',
      { notificationId: 'notif-1' },
      expect.objectContaining({ attempts: 3 }),
    );
    expect(result.status).toBe('queued');
  });

  // ۲) در dev پروایدر mock انتخاب و صدا زده می‌شود
  it('در محیط development پروایدر mock انتخاب و توسط job صدا زده می‌شود', async () => {
    const devConfig = new ConfigService({ NODE_ENV: 'development' });
    const kavenegar = new KavenegarProvider(devConfig);
    const mock = new MockSmsProvider();

    // انتخاب پروایدر بر اساس پیکربندی
    expect(chooseSmsProvider(devConfig, kavenegar, mock)).toBe(mock);

    // پروایدر mock در processor واقعاً صدا زده می‌شود
    const prisma = createPrismaMock();
    prisma.notification.findUnique.mockResolvedValue({
      id: 'notif-1',
      status: 'queued',
      channel: 'sms',
      templateCode: 'order_ready',
      recipient: '09123456789',
      payload: { trackingCode: 'YUMA-1234' },
    });

    const templates = new NotificationTemplatesService(prisma as never);
    const sendSpy = jest.spyOn(mock, 'send');
    const processor = new SendSmsProcessor(
      prisma as never,
      templates,
      mock as never,
    );

    await processor.process({
      data: { notificationId: 'notif-1' },
    } as never);

    expect(sendSpy).toHaveBeenCalledWith(
      '09123456789',
      'سفارش YUMA-1234 آماده تحویل است.',
    );

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: expect.objectContaining({
        status: 'sent',
        attempts: { increment: 1 },
      }),
    });
  });

  // ۳) متغیرهای قالب درست جایگزین می‌شوند
  it('متغیرهای {{var}} قالب با مقادیر دریافتی جایگزین می‌شوند', async () => {
    const prisma = createPrismaMock();
    prisma.notificationTemplate.findFirst.mockResolvedValue({
      ...SAMPLE_TEMPLATE,
      body: 'سفارش {{trackingCode}} برای {{customerName}} آماده است.',
    });

    const templates = new NotificationTemplatesService(prisma as never);

    await expect(
      templates.renderTemplate('order_ready', {
        trackingCode: 'YUMA-99',
        customerName: 'علی رضایی',
      }),
    ).resolves.toEqual({
      subject: null,
      body: 'سفارش YUMA-99 برای علی رضایی آماده است.',
    });

    // متغیر ناموجود به رشتهٔ خالی تبدیل می‌شود
    await expect(
      templates.renderTemplate('order_ready', { trackingCode: 'YUMA-99' }),
    ).resolves.toEqual({
      subject: null,
      body: 'سفارش YUMA-99 برای  آماده است.',
    });
  });

  // ۴) رویداد order.status_changed باعث ارسال SMS می‌شود
  it('رویداد order.status_changed پیامک متناظر با وضعیت جدید را ارسال می‌کند', async () => {
    const prisma = createPrismaMock();
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      trackingCode: 'YUMA-7',
      customerId: 'user-1',
      customer: { mobile: '09123456789', fullName: 'علی رضایی' },
    });

    const send = jest.fn(async () => ({ id: 'notif-1' }));
    const notifications = { send } as unknown as NotificationService;
    const listener = new OrderNotificationListener(prisma as never, notifications);

    const emitter = new EventEmitter2();
    emitter.on('order.status_changed', (payload) =>
      listener.handleStatusChanged(payload),
    );

    // انتقال به وضعیتی که قالب دارد → پیامک ارسال می‌شود
    await emitter.emitAsync('order.status_changed', {
      orderId: 'order-1',
      trackingCode: 'YUMA-7',
      customerId: 'user-1',
      from: 'in_cleaning',
      to: 'ready_for_delivery',
      actorId: 'admin-1',
      actorRole: 'admin',
    });

    expect(send).toHaveBeenCalledWith(
      '09123456789',
      'order_ready',
      { trackingCode: 'YUMA-7', customerName: 'علی رضایی' },
      { userId: 'user-1', orderId: 'order-1' },
    );

    // انتقال به وضعیت بدون قالب → پیامکی ارسال نمی‌شود (جلوگیری از اسپم)
    send.mockClear();
    await emitter.emitAsync('order.status_changed', {
      orderId: 'order-1',
      trackingCode: 'YUMA-7',
      customerId: 'user-1',
      from: 'ready_for_delivery',
      to: 'quality_control',
      actorId: 'admin-1',
      actorRole: 'admin',
    });

    expect(send).not.toHaveBeenCalled();
  });

  // ۵) خطای provider باعث failure در job می‌شود بدون rollback سفارش
  it('خطای پروایدر رکورد را failed می‌کند، job را failed می‌نماید و سفارش دست‌نخورده باقی می‌ماند', async () => {
    const prisma = createPrismaMock();
    prisma.notification.findUnique.mockResolvedValue({
      id: 'notif-1',
      status: 'queued',
      channel: 'sms',
      templateCode: 'order_ready',
      recipient: '09123456789',
      payload: { trackingCode: 'YUMA-1234' },
    });

    const failingProvider = {
      name: 'failing',
      send: jest.fn(async () => {
        throw new Error('خطای شبکهٔ کاونگر');
      }),
    } as never;

    const templates = new NotificationTemplatesService(prisma as never);
    const processor = new SendSmsProcessor(
      prisma as never,
      templates,
      failingProvider,
    );

    // خطا دوباره پرتاب می‌شود تا BullMQ job را failed کند
    await expect(
      processor.process({
        data: { notificationId: 'notif-1' },
        attemptsMade: 0,
      } as never),
    ).rejects.toThrow('خطای شبکهٔ کاونگر');

    // رکورد اعلان به‌عنوان failed با پیام خطا ثبت می‌شود
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: expect.objectContaining({
        status: 'failed',
        errorMessage: 'خطای شبکهٔ کاونگر',
      }),
    });

    // پردازشگر ارسال پیامک هرگز سفارش را تغییر نمی‌دهد — rollback نمی‌شود
    expect(prisma.order.update).not.toHaveBeenCalled();
  });
});
