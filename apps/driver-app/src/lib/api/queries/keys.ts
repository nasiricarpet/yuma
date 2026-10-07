/**
 * کلیدهای کوئری React Query اپ سفیر — منبع واحد برای cache keys.
 *
 * کلیدها سلسله‌مراتبی هستند تا invalidation دقیق ممکن باشد:
 * `['assignments', 'my']` → لیست وظایف من
 */
export const queryKeys = {
  /** لیست وظایف محول‌شده به سفیرِ فعلی */
  myAssignments: ['assignments', 'my'] as const,
} as const;
