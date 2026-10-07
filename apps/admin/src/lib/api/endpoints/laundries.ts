import { apiGet } from '../client';
import type { PaginatedResponse, PaginationParams, Workshop } from '@/types';

/**
 * endpoints مربوط به کارگاه‌ها (قالیشویی‌ها)
 */
export const laundryEndpoints = {
  /** لیست کارگاه‌ها */
  list: '/laundry/all',
} as const;

/**
 * لیست کارگاه‌ها — `GET {NEXT_PUBLIC_API_URL}/laundry/all`
 *
 * فیلترها (page, perPage, search, sort) به‌صورت query string ارسال می‌شوند.
 */
export async function listLaundries(
  filters?: PaginationParams,
): Promise<PaginatedResponse<Workshop>> {
  const search = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return apiGet<PaginatedResponse<Workshop>>(
    query ? `${laundryEndpoints.list}?${query}` : laundryEndpoints.list,
  );
}
