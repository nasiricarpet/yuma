import { UserRole as PrismaUserRole } from '@yuma/db';
import { USER_ROLES } from '@yuma/types';

describe('UserRole (RBAC)', () => {
  it('باید دقیقاً ۹ نقش داشته باشد', () => {
    expect(USER_ROLES).toHaveLength(9);
  });

  it('admin جزو نقش‌هاست', () => {
    expect(USER_ROLES).toContain('admin');
  });

  it('نقش‌ها مقدار تکراری ندارند', () => {
    expect(new Set(USER_ROLES).size).toBe(USER_ROLES.length);
  });

  it('نقش‌های جدید RBAC وجود دارندند', () => {
    expect(USER_ROLES).toEqual(
      expect.arrayContaining(['manager', 'expert', 'support', 'finance']),
    );
  });

  it('با enum پرایسما همگام است (منبع واحد در برابر drift)', () => {
    const prismaRoles = Object.keys(PrismaUserRole).sort();
    const typeRoles = [...USER_ROLES].sort();

    expect(prismaRoles).toEqual(typeRoles);
  });
});
