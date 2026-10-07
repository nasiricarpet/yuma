import { apiGet } from '../client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { Order } from '@yuma/types';

/**
 * endpoints مربوط به سفارش‌ها
 */
export const orderEndpoints = {
  /** لیست سفارش‌ها */
  list: '/orders',
  /** جزئیات یک سفارش */
  detail: (id: string) => `/orders/${id}`,
  /** تغییر وضعیت سفارش */
  changeStatus: (id: string) => `/orders/${id}/status`,
  /** لغو سفارش */
  cancel: (id: string) => `/orders/${id}/cancel`,
  /** تخصیص سفیر به سفارش */
  assignDriver: (id: string) => `/orders/${id}/assign-driver`,
  /** آپلود مدیای سفارش */
  uploadMedia: (id: string) => `/orders/${id}/media`,
} as const;

/**
 * لیست سفارش‌ها — `GET {NEXT_PUBLIC_API_URL}/orders`
 *
 * فیلترها (page, perPage, search, sort) به‌صورت query string ارسال می‌شوند.
 */
export async function listOrders(
  filters?: PaginationParams,
): Promise<PaginatedResponse<Order>> {
  const search = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return apiGet<PaginatedResponse<Order>>(
    query ? `${orderEndpoints.list}?${query}` : orderEndpoints.list,
  );
}

/**
 * جزئیات یک سفارش — `GET {NEXT_PUBLIC_API_URL}/orders/:id`
 */
export async function getOrderById(id: string): Promise<Order> {
  return apiGet<Order>(orderEndpoints.detail(id));
}
