import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getMyOrders, getOrderById } from '../endpoints/orders';
import { queryKeys } from './keys';

/**
 * لیست سفارش‌های مشتریِ فعلی.
 *
 * @example
 * const { data: orders, isLoading } = useMyOrders();
 */
export function useMyOrders() {
  return useQuery({
    queryKey: queryKeys.myOrders,
    queryFn: getMyOrders,
    placeholderData: keepPreviousData,
  });
}

/**
 * جزئیات یک سفارش — تا زمانی که `id` تعیین نشده فعال نمی‌شود.
 *
 * @example
 * const { data: order, isLoading } = useOrder(id);
 */
export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.order(id) : ['orders', 'detail'],
    queryFn: () => getOrderById(id as string),
    enabled: Boolean(id),
  });
}
