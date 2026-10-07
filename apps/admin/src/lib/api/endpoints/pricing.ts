import { apiGet } from '../client';
import type { PaginatedResponse, PaginationParams, Quotation } from '@/types';

/**
 * endpoints مربوط به قیمت‌گذاری و پیش‌فاکتور
 */
export const pricingEndpoints = {
  /** لیست پیش‌فاکتورها */
  list: '/pricing/all',
  /** دریافت پیش‌فاکتور سفارش */
  quotationByOrder: (orderId: string) => `/pricing/orders/${orderId}/quotation`,
  /** ثبت پیش‌فاکتور توسط قالیشویی */
  createQuotation: (orderId: string) => `/pricing/orders/${orderId}/quotation`,
  /** تأیید پیش‌فاکتور توسط مشتری */
  approveQuotation: (orderId: string) => `/pricing/orders/${orderId}/quotation/approve`,
} as const;

/**
 * لیست پیش‌فاکتورها — `GET {NEXT_PUBLIC_API_URL}/pricing/all`
 *
 * فیلترها (page, perPage, search, sort) به‌صورت query string ارسال می‌شوند.
 */
export async function listQuotations(
  filters?: PaginationParams,
): Promise<PaginatedResponse<Quotation>> {
  const search = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return apiGet<PaginatedResponse<Quotation>>(
    query ? `${pricingEndpoints.list}?${query}` : pricingEndpoints.list,
  );
}
