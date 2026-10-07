'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listDrivers } from '../endpoints/drivers';
import { listKey, queryKeys } from './keys';
import type { PaginationParams } from '@/types';

/**
 * لیست سفیران — داده‌ها از `listDrivers` واکشی می‌شوند.
 *
 * @example
 * const { data, isLoading } = useDrivers();
 * const drivers = data?.data ?? [];
 */
export function useDrivers(params?: PaginationParams) {
  return useQuery({
    queryKey: listKey(queryKeys.drivers, params),
    queryFn: () => listDrivers(params),
    placeholderData: keepPreviousData,
  });
}
