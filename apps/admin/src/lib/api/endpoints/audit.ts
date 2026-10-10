import { apiGet } from '../client';
import type {
  AuditListParams,
  AuditLogEntry,
  AuditStats,
  PaginatedResponse,
} from '@/types';

/**
 * endpoints مربوط به لاگ ممیزی — مسیر /admin/audit-log
 *
 * نیازمند نقش `admin` یا `manager` است (RolesGuard بک‌اند).
 */
export const auditEndpoints = {
  /** لیست صفحه‌بندی‌شده‌ی رویدادهای ممیزی */
  list: '/admin/audit-log',
  /** آمار رویدادها بر اساس عمل و نوع موجودیت */
  stats: '/admin/audit-log/stats',
} as const;

/**
 * پوشش استاندارد پاسخ‌های ماژول ممیزی — `{ success, data }`.
 *
 * برخلاف ماژول سفارش‌ها که از `ok` استفاده می‌کند، اینجا فیلد `success` است.
 */
type AuditSuccessResponse<T> = { success: true; data: T };

/**
 * باز کردن پوشش پاسخ — اگر بک‌اند داده را در `{ success, data }` فرستاده باشد
 *، خود `data` برمی‌گردد؛ وگرنی همان payload اصلی.
 */
function unwrap<T>(payload: unknown): T {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'success' in payload &&
    (payload as AuditSuccessResponse<unknown>).success === true &&
    'data' in payload
  ) {
    return (payload as AuditSuccessResponse<T>).data;
  }

  return payload as T;
}

/**
 * شکل خام پاسخ لیست بک‌اند — بک‌اند از `items`/`limit` استفاده می‌کند
 * (برخلاف `PaginatedResponse` که `data`/`perPage` دارد).
 */
interface RawAuditList {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * ساخت پارامترهای query — فقط مقادیر تعریف‌شده و غیرخالی ارسال می‌شوند.
 * تاریخ‌ها به ISO 8601 تبدیل می‌شوند تا ValidationPipe بک‌اند بپذیرد.
 */
function buildQuery(params?: AuditListParams): string {
  const search = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value instanceof Date ? value.toISOString() : String(value));
    }
  });

  return search.toString();
}

/**
 * لیست رویدادهای ممیزی — `GET {NEXT_PUBLIC_API_URL}/admin/audit-log`
 *
 * جدیدترین رویدادها اول می‌آیند. پاسخ به `PaginatedResponse` نرمال می‌شود
 * تا با سایر لیست‌های پنل همخوان باشد.
 */
export async function listAudit(
  params?: AuditListParams,
): Promise<PaginatedResponse<AuditLogEntry>> {
  const query = buildQuery(params);
  const payload = await apiGet<unknown>(
    query ? `${auditEndpoints.list}?${query}` : auditEndpoints.list,
  );
  const raw = unwrap<RawAuditList>(payload);

  return {
    data: raw.items,
    total: raw.total,
    page: raw.page,
    perPage: raw.limit,
    totalPages: raw.totalPages,
  };
}

/**
 * آمار رویدادها — `GET {NEXT_PUBLIC_API_URL}/admin/audit-log/stats`
 *
 * فیلترها مشابه `listAudit` اعمال می‌شوند تا آمار با لیست همخوان باشد.
 */
export async function getAuditStats(
  params?: AuditListParams,
): Promise<AuditStats> {
  const query = buildQuery(params);
  const payload = await apiGet<unknown>(
    query ? `${auditEndpoints.stats}?${query}` : auditEndpoints.stats,
  );

  return unwrap<AuditStats>(payload);
}
