/**
 * کلیدهای کوئری React Query — منبع واحد برای cache keys.
 *
 * کلیدها سلسله‌مراتبی هستند تا invalidation دقیق ممکن باشد:\n * `['orders', 'my']` → لیست سفارش‌های من، `['orders', id]` → یک سفارش
 */
export const queryKeys = {
  /** لیست سفارش‌های مشتریِ فعلی */
  myOrders: ['orders', 'my'] as const,
  /** جزئیات یک سفارش */
  order: (id: string) => ['orders', id] as const,
} as const;
