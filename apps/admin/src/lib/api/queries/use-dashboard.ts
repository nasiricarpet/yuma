'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardEndpoints, getDashboardStats } from '../endpoints/dashboard';
import { fetchOne } from './fetchers';
import { queryKeys } from './keys';
import type { RevenueChartPoint } from '@/types';

/**
 * آمار کلی داشبورد — شامل شمارنده‌ها و دادهٔ نمودار درآمد.
 *
 * @example
 * const { data, isLoading } = useDashboardStats();
 * const stats = data?.revenueData ?? [];
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: getDashboardStats,
  });
}

/** نمودار درآمد دوره‌ای */
export function useRevenueChart() {
  return useQuery({
    queryKey: queryKeys.dashboard.revenue,
    queryFn: () => fetchOne<RevenueChartPoint[]>(dashboardEndpoints.revenueChart),
  });
}
