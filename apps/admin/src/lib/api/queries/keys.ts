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
  payments: ['payments'] as const,
  /** لیست پیش‌فاکتورها */
  quotations: ['quotations'] as const,
  quotation: (orderId: string) => ['quotations', orderId] as const,
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    revenue: ['dashboard', 'revenue'] as const,
  },
  reports: ['reports'] as const,
  profile: ['profile'] as const,
} as const;

/** کلید لیست صفحه‌بندی‌شده — پارامترها در کلید می‌نشینند تا کش جدا باشد */
export function listKey(
  base: readonly string[],
  params?: PaginationParams,
): readonly (string | PaginationParams)[] {
  return params ? [...base, 'list', params] : [...base, 'list'];
}
