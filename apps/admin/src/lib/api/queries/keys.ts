import type { PaginationParams } from '@/types';

/**
 * کلیدهای کوئری React Query — منبع واحد برای cache keys
 *
 * کلیدها به‌صورت سلسله‌مراتبی هستند تا invalidation دقیق ممکن باشد:
 * `['orders']` → همه سفارش‌ها، `['orders', id]` → یک سفارش
 */
export const queryKeys = {
  orders: ['orders'] as const,
  order: (id: string) => ['orders', id] as const,
  customers: ['customers'] as const,
  laundries: ['laundries'] as const,
  drivers: ['drivers'] as const,
  /** لیست پرسنل — /admin/users/staff */
  staff: ['users', 'staff'] as const,
  payments: ['payments'] as const,
  /** لیست تسویه‌ی دوره‌ای کارگاه‌ها — /admin/settlements */
  settlements: ['settlements'] as const,
  /** لیست رویدادهای ممیزی — /admin/audit-log */
  auditLog: ['audit-log'] as const,
  /** آمار رویدادهای ممیزی */
  auditLogStats: ['audit-log', 'stats'] as const,
  /** نقشه‌ی تنظیمات سیستم — /admin/settings */
  settings: ['settings'] as const,
  /** لیست پیش‌فاکتورها */
  quotations: ['quotations'] as const,
  quotation: (orderId: string) => ['quotations', orderId] as const,
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    revenue: ['dashboard', 'revenue'] as const,
  },
  reports: ['reports'] as const,
  /** لیست تیکت‌های پشتیبانی — /support/tickets */
  supportTickets: ['support', 'tickets'] as const,
  /** جزئیات یک تیکت پشتیبانی */
  supportTicket: (id: string) => ['support', 'tickets', id] as const,
  profile: ['profile'] as const,
} as const;

/** کلید لیست صفحه‌بندی‌شده — پارامترها در کلید می‌نشینند تا کش جدا باشد */
export function listKey(
  base: readonly string[],
  params?: PaginationParams,
): readonly (string | PaginationParams)[] {
  return params ? [...base, 'list', params] : [...base, 'list'];
}
