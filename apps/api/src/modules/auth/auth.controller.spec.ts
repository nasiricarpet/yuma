import type { Request } from 'express';
import { AuthController } from './auth.controller';
import type { AuthService, VerifyResult } from './auth.service';

/**
 * AuditService جعلی — فراخوانی‌های `logFromRequest` را نگه می‌دارد
 * تا رویدادهای ورود و خروج در تست‌ها قابل بررسی باشند.
 */
function createAuditMock() {
  const calls: Array<{
    req: unknown;
    action: string;
    entity: { type: string; id?: string | null };
    before?: unknown;
    after?: unknown;
    context?: Record<string, unknown>;
  }> = [];

  return {
    calls,
    logFromRequest: jest.fn(async (req, action, entity, before, after, context) => {
      calls.push({ req, action, entity, before, after, context });
    }),
  };
}

/** درخواست HTTP جعلی با IP و User-Agent — برای تست استخراج اطلاعات درخواست */
function fakeRequest(overrides: Record<string, any> = {}): Request {
  return {
    ip: '85.10.20.30',
    headers: { 'user-agent': 'Jest/1.0 (test)' },
    ...overrides,
  } as unknown as Request;
}

describe('AuthController — رویدادهای ممیزی', () => {
  let audit: ReturnType<typeof createAuditMock>;
  let controller: AuthController;

  const verifyResult: VerifyResult = {
    userId: 'user-1',
    role: 'customer',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(() => {
    audit = createAuditMock();
    controller = new AuthController(
      { request: jest.fn(), verify: jest.fn() } as never,
      {
        verifyOtp: jest.fn(async () => verifyResult),
        logout: jest.fn(async () => undefined),
        refreshToken: jest.fn(async () => ({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        })),
      } as unknown as AuthService,
      audit as never,
    );
  });

  it('ورود موفق یک رویداد ممیزی login می‌سازد', async () => {
    const result = await controller.verify(
      fakeRequest({ ip: '91.92.93.94' }),
      { mobile: '09120000001', code: '123456' },
    );

    // توکن‌ها به مشتری برگردانده می‌شوند
    expect(result).toMatchObject({
      ok: true,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    // دقیقاً یک رویداد ورود ثبت شده است
    expect(audit.logFromRequest).toHaveBeenCalledTimes(1);

    const entry = audit.calls[0];
    expect(entry.action).toBe('login');
    // موجودیت: خود کاربری که تازه وارد شده
    expect(entry.entity).toEqual({ type: 'user', id: 'user-1' });
    // مسیر عمومی است — بازیگر از context می‌آید، نه از req.user
    expect(entry.context).toEqual({ actorId: 'user-1', actorRole: 'customer' });
    // IP از درخواست استخراج شده است
    expect(entry.req).toMatchObject({ ip: '91.92.93.94' });
  });

  it('خروج یک رویداد ممیزی logout می‌سازد', async () => {
    await controller.logout(
      fakeRequest(),
      { id: 'user-1', mobile: '09120000001', role: 'customer' },
      { refreshToken: 'refresh-token' },
    );

    expect(audit.logFromRequest).toHaveBeenCalledTimes(1);

    const entry = audit.calls[0];
    expect(entry.action).toBe('logout');
    expect(entry.entity).toEqual({ type: 'user', id: 'user-1' });
  });

  it('شکست ثبت ممیزی ورود را قطع نمی‌کند', async () => {
    (audit.logFromRequest as jest.Mock).mockRejectedValueOnce(new Error('db down'));

    const result = await controller.verify(fakeRequest(), {
      mobile: '09120000001',
      code: '123456',
    });

    // با وجود شکست ممیزی، توکن‌ها برمی‌گردند
    await expect(result).toMatchObject({ ok: true, accessToken: 'access-token' });
  });
});
