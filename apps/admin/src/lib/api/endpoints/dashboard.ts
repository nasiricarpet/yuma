import { apiGet } from '../client';
import type { ApiResponse, DashboardStats } from '@/types';

/**
 * endpoints مربوط به داشبورد و گزارش‌ها
 */
export const dashboardEndpoints = {
  /** آمار کلی داشبورد */
  stats: '/dashboard/stats',
  /** نمودار درآمد دوره‌ای */
  revenueChart: '/dashboard/revenue',
  /** نمودار تعداد سفارش‌ها */
  ordersChart: '/dashboard/orders-chart',
} as const;

/**
 * آمار کلی داشبورد — `GET {NEXT_PUBLIC_API_URL}/dashboard/stats`
 *
 * پاسخ شامل شمارنده‌های اصلی (totalOrders، totalRevenue، activeDrivers …)
 * و آرایهٔ `revenueData` برای رسم نمودار دوره‌ای است.
 *
 * @example
 * const stats = await getDashboardStats();
 * console.log(stats.totalOrders, stats.revenueData);
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const payload = await apiGet<DashboardStats | ApiResponse<DashboardStats>>(
    dashboardEndpoints.stats,
  );

  // بک‌اند ممکن است داده را به‌صورت `{ ok, data }` یا تخت بفرستد — هر دو حالت پشتیبانی می‌شود
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'ok' in payload &&
    (payload as ApiResponse<DashboardStats>).ok === true &&
    'data' in (payload as ApiResponse<DashboardStats>)
  ) {
    return (payload as ApiResponse<DashboardStats>).data;
  }
  return payload as DashboardStats;
}
