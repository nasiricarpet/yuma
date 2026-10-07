import { apiGet } from '../client';
import type { Driver, PaginatedResponse, PaginationParams } from '@/types';

/**
 * endpoints مربوط به سفیران
 */
export const driverEndpoints = {
  /** لیست سفیران */
  list: '/driver/all',
} as const;

/**
 * لیست سفیران — `GET {NEXT_PUBLIC_API_URL}/driver/all`
 *
 * فیلترها (page, perPage, search, sort) به‌صورت query string ارسال می‌شوند.
 */
export async function listDrivers(
  filters?: PaginationParams,
): Promise<PaginatedResponse<Driver>> {
  const search = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return apiGet<PaginatedResponse<Driver>>(
    query ? `${driverEndpoints.list}?${query}` : driverEndpoints.list,
  );
}
