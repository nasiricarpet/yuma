import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

/**
 * ساخت یک ArgumentsHost جعلی برای آزمودن فیلتر بدون بالا آوردن اپ کامل
 */
function createHost() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const response = { status };
  const request = { url: '/api/test', method: 'GET' };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as any;

  return { host, status, json };
}

describe('AllExceptionsFilter — پیام‌های فارسی', () => {
  const filter = new AllExceptionsFilter();

  it('خطای اعتبارسنجی را با پیام و فهرست خطاهای فارسی برمی‌گرداند', () => {
    const { host, status, json } = createHost();

    filter.catch(
      new BadRequestException({
        ok: false,
        message: 'اطلاعات ارسالی نامعتبر است',
        errors: ['شماره موبایل نامعتبر است'],
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    const payload = json.mock.calls[0][0];
    expect(payload.ok).toBe(false);
    expect(payload.message).toBe('اطلاعات ارسالی نامعتبر است');
    expect(payload.errors).toEqual(['شماره موبایل نامعتبر است']);
    expect(payload.path).toBe('/api/test');
    expect(typeof payload.timestamp).toBe('string');
  });

  it('خطای ۴۰۴ را با پیام فارسی «یافت نشد» جایگزین می‌کند', () => {
    const { host, status, json } = createHost();

    filter.catch(new NotFoundException('Not Found'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json.mock.calls[0][0].message).toBe('منبع مورد نظر یافت نشد');
  });

  it('خطای ناشناخته را به ۵۰۰ فارسی تبدیل می‌کند', () => {
    const { host, status, json } = createHost();

    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json.mock.calls[0][0].message).toBe(
      'خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید',
    );
  });
});
