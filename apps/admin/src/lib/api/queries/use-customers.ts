'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listCustomers } from '../endpoints/customers';
import { listKey, queryKeys } from './keys';
import type { PaginationParams } from '@/types';

/**
 * لیست مشتریان — داده‌ها از `listCustomers` واکشی می‌شوند.
 *
 * @example
 * const { data, isLoading } = useCustomers();
 * const customers = data?.data ?? [];
 */
export function useCustomers(params?: PaginationParams) {
  return useQuery({
    queryKey: listKey(queryKeys.customers, params),
    queryFn: () => listCustomers(params),
    placeholderData: keepPreviousData,
  });
}
