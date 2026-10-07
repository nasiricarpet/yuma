import { apiGet } from '../client';
import type { PaginatedResponse, PaginationParams, Payment } from '@/types';

/**
 * endpoints مربوط به پرداخت‌ها
 */
export const paymentEndpoints = {
  /** لیست پرداخت‌ها */
  list: '/payments/all',
  /** جزئیات یک پرداخت */
  detail: (id: string) => `/payments/${id}`,
} as const;

/**
 * لیست پرداخت‌ها — `GET {NEXT_PUBLIC_API_URL}/payments/all`
 *
 * فیلترها (page, perPage, search, sort) به‌صورت query string ارسال می‌شوند.
 */
export async function listPayments(
  filters?: PaginationParams,
): Promise<PaginatedResponse<Payment>> {
  const search = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return apiGet<PaginatedResponse<Payment>>(
    query ? `${paymentEndpoints.list}?${query}` : paymentEndpoints.list,
  );
}
