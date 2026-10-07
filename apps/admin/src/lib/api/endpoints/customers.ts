import { apiGet } from '../client';
import type { Customer, PaginatedResponse, PaginationParams } from '@/types';

/**
 * endpoints مربوط به مشتریان
 */
export const customerEndpoints = {
  /** لیست مشتریان */
  list: '/users/customers',
} as const;

/**
 * لیست مشتریان — `GET {NEXT_PUBLIC_API_URL}/users/customers`
 *
 * فیلترها (page, perPage, search, sort) به‌صورت query string ارسال می‌شوند.
 */
export async function listCustomers(
  filters?: PaginationParams,
): Promise<PaginatedResponse<Customer>> {
  const search = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return apiGet<PaginatedResponse<Customer>>(
    query ? `${customerEndpoints.list}?${query}` : customerEndpoints.list,
  );
}
