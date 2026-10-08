import 'reflect-metadata';
import { plainToInstance, Transform } from 'class-transformer';
import { validate } from 'class-validator';
import { AdminListUsersDto } from './admin-list-users.dto';

/**
 * کوارری‌های HTTP به‌صورت رشته می‌رسند. اگر `?isActive=false` به `true`
 * تبدیل شود، ادمین به‌جای غیرفعال‌ها لیست فعال‌ها را می‌بیند.
 *
 * نکته: ValidationPipe گلوبال هیچ `transformOptions`‌ای ندارد، پس
 * `plainToInstance` بدون `enableImplicitConversion` صدا زده می‌شود —
 * دقیقاً همین‌جا، تا تبدیل فقط بر پایه‌ی دکوریتورها باشد.
 */
describe('AdminListUsersDto', () => {
  const parse = async (raw: Record<string, unknown>) => {
    const dto = plainToInstance(AdminListUsersDto, raw);
    const errors = await validate(dto);
    return { dto, errors };
  };

  it('رشته‌های بولی به بولی واقعی تبدیل می‌شوند', async () => {
    expect((await parse({ isActive: 'true' })).dto.isActive).toBe(true);
    expect((await parse({ isActive: 'false' })).dto.isActive).toBe(false);
  });

  it('صفر و یک هم معتبر تفسیر می‌شوند', async () => {
    expect((await parse({ isActive: '1' })).dto.isActive).toBe(true);
    expect((await parse({ isActive: '0' })).dto.isActive).toBe(false);
  });

  it('بولی واقعی دست‌نخورده می‌ماند', async () => {
    expect((await parse({ isActive: true })).dto.isActive).toBe(true);
    expect((await parse({ isActive: false })).dto.isActive).toBe(false);
  });

  it('مقادیر بولی نامعتبر رد می‌شوند', async () => {
    const { errors } = await parse({ isActive: 'bogus' });
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('isActive');
  });

  it('صفحه‌بندی رشته‌ای به عدد تبدیل و محدود می‌شود', async () => {
    const ok = await parse({ page: '3', limit: '50' });
    expect(ok.dto.page).toBe(3);
    expect(ok.dto.limit).toBe(50);
    expect(ok.errors).toHaveLength(0);
  });

  it('صفحه صفر و limit بالای سقف رد می‌شوند', async () => {
    const bad = await parse({ page: '0', limit: '500' });
    const props = bad.errors.map((e) => e.property);
    expect(props).toContain('page');
    expect(props).toContain('limit');
  });

  it('در نبود پارامتر، مقادیر پیش‌فرض اعمال می‌شود', async () => {
    const { dto, errors } = await parse({});
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
  });
});

/**
 * سنتیت لازم: `@Transform` پس از تبدیل ضمنی اجرا می‌شود و می‌تواند
 * مقدار نهایی را بازنویسی کند. اگر این رفتار در نسخه‌ی کتابخانه تغییر کرد،
 * اصلاح `isActive` بالاتر از کار می‌افتد و این تست زودتر به‌درد می‌خورد.
 */
describe('سنتیت @Transform', () => {
  class Mini {
    @Transform(
      ({ value }) => (value === 'no' ? false : value),
      { toClassOnly: true },
    )
    flag?: boolean;
  }

  it('مقدار تبدیل‌شده را بازنویسی می‌کند', () => {
    expect(plainToInstance(Mini, { flag: 'no' }).flag).toBe(false);
  });
});
