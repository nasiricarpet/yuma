'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listLaundries } from '../endpoints/laundries';
import { listKey, queryKeys } from './keys';
import type { PaginationParams } from '@/types';

/**
 * لیست کارگاه‌ها — داده‌ها از `listLaundries` واکشی می‌شوند.
 *
 * @example
 * const { data, isLoading } = useLaundries();
 * const laundries = data?.data ?? [];
 */
export function useLaundries(params?: PaginationParams) {
  return useQuery({
    queryKey: listKey(queryKeys.laundries, params),
    queryFn: () => listLaundries(params),
    placeholderData: keepPreviousData,
  });
}
