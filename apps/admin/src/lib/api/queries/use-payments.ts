'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listPayments } from '../endpoints/payments';
import { listKey, queryKeys } from './keys';
import type { PaginationParams } from '@/types';

/**
 * لیست پرداخت‌ها — داده‌ها از `listPayments` واکشی می‌شوند.
 *
 * @example
 * const { data, isLoading } = usePayments();
 * const payments = data?.data ?? [];
 */
export function usePayments(params?: PaginationParams) {
  return useQuery({
    queryKey: listKey(queryKeys.payments, params),
    queryFn: () => listPayments(params),
    placeholderData: keepPreviousData,
  });
}
