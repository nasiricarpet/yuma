import { describe, expect, it } from 'vitest';
import {
  createPersianTextSchema,
  ibanSchema,
  isValidIban,
  isValidPersianName,
  persianNameSchema,
  persianTextSchema,
} from '../src';

describe('ibanSchema', () => {
  it('شبای معتبر (IR820540102680020817909002)', () => {
    // شبای معتبر استاندارد برای تست
    expect(ibanSchema.parse('IR820540102680020817909002')).toBe(
      'IR820540102680020817909002',
    );
  });

  it('پذیرش فاصله و حروف کوچک', () => {
    expect(isValidIban('ir82 0540-102680020817909002')).toBe(true);
  });

  it('رد شبا با رقم کنترل غلط', () => {
    expect(isValidIban('IR820540102680020817909001')).toBe(false);
  });

  it('رد طول نادرست', () => {
    expect(isValidIban('IR82054010268002081790900')).toBe(false);
  });

  it('رد پیشوند غیر ایرانی', () => {
    expect(isValidIban('DE820540102680020817909002')).toBe(false);
  });
});

describe('persianNameSchema', () => {
  it('نام ساده', () => {
    expect(persianNameSchema.parse('علی رضایی')).toBe('علی رضایی');
  });

  it('نام با نیم‌فاصله (ZWNJ)', () => {
    expect(isValidPersianName('محمدعلی مهدوی‌کنی')).toBe(true);
  });

  it('نرمال‌سازی فاصله‌های تکراری', () => {
    expect(persianNameSchema.parse('علی    رضایی')).toBe('علی رضایی');
  });

  it('رد حروف لاتین', () => {
    expect(isValidPersianName('Ali Rezaei')).toBe(false);
  });

  it('رد نام تک‌حرفی', () => {
    expect(isValidPersianName('ع')).toBe(false);
  });
});

describe('persianTextSchema', () => {
  it('متن فارسی با علائم', () => {
    expect(persianTextSchema.parse('سلام، دنیا!')).toBe('سلام، دنیا!');
  });

  it('رد متن با حروف لاتین', () => {
    expect(() => persianTextSchema.parse('Hello')).toThrow();
  });

  it('رد متن خالی', () => {
    expect(() => persianTextSchema.parse('  ')).toThrow();
  });

  it('createPersianTextSchema با محدودیت طول', () => {
    const schema = createPersianTextSchema({ min: 5, max: 10 });
    expect(schema.parse('سلام دنیا')).toBe('سلام دنیا');
    expect(() => schema.parse('سلام')).toThrow();
  });
});
