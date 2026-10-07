import { apiGet } from '../client';
import type {
  ApiErrorResponse,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

/**
 * پاسخ بک‌اند ممکن است به‌صورت `{ ok, data }` یا دادهٔ خالی باشد.
 * این تابع هر دو شکل را به‌درستی باز می‌کند.
 */
function unwrap<T>(payload: T | ApiResponse<T>): T {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'ok' in payload &&
    (payload as ApiResponse<T>).ok === true &&
    'data' in (payload as ApiResponse<T>)
  ) {
    return (payload as ApiResponse<T>).data;
  }
  return payload as T;
}

/** گرفتن یک آیتم — `GET url` */
export async function fetchOne<T>(url: string): Promise<T> {
  const payload = await apiGet<T | ApiResponse<T>>(url);
  return unwrap(payload);
}

/** گرفتن یک لیست صفحه‌بندی‌شده — `GET url` با پارامترهای صفحه */
export async function fetchList<T>(
  url: string,
  params?: PaginationParams,
): Promise<PaginatedResponse<T>> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.perPage) search.set('perPage', String(params.perPage));
  if (params?.search) search.set('search', params.search);
  if (params?.sort) search.set('sort', params.sort);

  const query = search.toString();
  const payload = await apiGet<PaginatedResponse<T> | ApiResponse<PaginatedResponse<T>>>(
    query ? `${url}?${query}` : url,
  );
  const data = unwrap(payload);

  // اگر بک‌اند فقط آرایه فرستاد، یک پاسخ صفحه‌بندی‌شدهٔ پیش‌فرض می‌سازیم
  if (Array.isArray(data)) {
    return { data, total: data.length, page: 1, perPage: data.length, totalPages: 1 };
  }
  return data;
}

/** نوع خطای API برای استفاده در mutationها */
export type { ApiErrorResponse };
