'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getOrderById, listOrders } from '../endpoints/orders';
import { listKey, queryKeys } from './keys';
import type { PaginationParams } from '@/types';

/**
 * لیست سفارش‌ها — داده‌ها از `listOrders` واکشی می‌شوند.
 *
 * @example
 * const { data, isLoading } = useOrders();
 * const orders = data?.data ?? [];
 */
export function useOrders(params?: PaginationParams) {
  return useQuery({
    queryKey: listKey(queryKeys.orders, params),
    queryFn: () => listOrders(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * جزئیات یک سفارش — تا زمانی که `id` تعیین نشده فعال نمی‌شود.
 *
 * @example
 * const { data: order } = useOrder(id);
 */
export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.order(id) : ['orders', 'detail'],
    queryFn: () => getOrderById(id as string),
    enabled: Boolean(id),
  });
}
