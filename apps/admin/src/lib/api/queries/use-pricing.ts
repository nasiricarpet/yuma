'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listQuotations } from '../endpoints/pricing';
import { listKey, queryKeys } from './keys';
import type { PaginationParams } from '@/types';

/**
 * لیست پیش‌فاکتورها — داده‌ها از `listQuotations` واکشی می‌شوند.
 *
 * @example
 * const { data, isLoading } = useQuotations();
 * const quotations = data?.data ?? [];
 */
export function useQuotations(params?: PaginationParams) {
  return useQuery({
    queryKey: listKey(queryKeys.quotations, params),
    queryFn: () => listQuotations(params),
    placeholderData: keepPreviousData,
  });
}
