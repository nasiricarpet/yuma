import { apiGet, apiPost } from '../client';
import type {
  PaginatedResponse,
  Settlement,
  SettlementListParams,
} from '@/types';

/**
 * endpoints مربوط به تسویه‌ی دوره‌ای کارگاه‌ها — مسیر /admin/settlements
 *
 * نیازمند نقش `admin` است (RolesGuard بک‌اند).
 */
export const settlementEndpoints = {
  /** لیست صفحه‌بندی‌شده‌ی تسویه‌ها */
  list: '/admin/settlements',
  /** محاسبه‌ی زنده‌ی یک دوره — ردیف را upsert می‌کند */
  preview: '/admin/settlements/preview',
  /** علامت‌گذاری تسویه به‌عنوان پرداخت‌شده */ markPaid: (id: string) =>
    `/admin/settlements/${id}/mark-paid`,
} as const;

/**
 * شکل خام پاسخ لیست بک‌اند — بک‌اند از `items`/`limit` استفاده می‌کند
 * (برخلاف `PaginatedResponse` که `data`/`perPage` دارد).
 */
interface RawSettlementList {
  items: Settlement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** ساخت پارامترهای query — فقط مقادیر تعریف‌شده و غیرخالی ارسال می‌شوند */
function buildQuery(params?: SettlementListParams): string {
  const search = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });

  return search.toString();
}

/**
 * لیست تسویه‌ها — `GET {NEXT_PUBLIC_API_URL}/admin/settlements`
 *
 * جدیدترین دوره‌ها اول می‌آیند. پاسخ به `PaginatedResponse` نرمال می‌شود
 * تا با سایر لیست‌های پنل همخوان باشد.
 */
export async function listSettlements(
  params?: SettlementListParams,
): Promise<PaginatedResponse<Settlement>> {
  const query = buildQuery(params);
  const raw = await apiGet<RawSettlementList>(
    query ? `${settlementEndpoints.list}?${query}` : settlementEndpoints.list,
  );

  return {
    data: raw.items,
    total: raw.total,
    page: raw.page,
    perPage: raw.limit,
    totalPages: raw.totalPages,
  };
}

/** خروجی محاسبه‌ی یک دوره — مبالغ از سمت API رشته‌اند (BigInt سریال‌شده) */
export interface SettlementPreview {
  workshopId: string;
  periodStart: string;
  periodEnd: string;
  grossMinor: string;
  commissionMinor: string;
  netPayableMinor: string;
}

/**
 * محاسبه‌ی تسویه‌ی یک دوره — `GET {NEXT_PUBLIC_API_URL}/admin/settlements/preview`
 *
 * ردیف تسویه را upsert می‌کند: اگر وجود نداشته باشد با وضعیت `pending`
 * ساخته می‌شود و اگر هنوز پرداخت‌نشده باشد مبالغش به‌روزرسانی می‌شود.
 */
export async function previewSettlement(
  workshopId: string,
  month: string,
): Promise<SettlementPreview> {
  const search = new URLSearchParams({ workshopId, month });

  return apiGet<SettlementPreview>(`${settlementEndpoints.preview}?${search}`);
}

/**
 * علامت‌گذاری تسویه به‌عنوان پرداخت‌شده —
 * `POST {NEXT_PUBLIC_API_URL}/admin/settlements/:id/mark-paid`
 *
 * @param id        شناسه‌ی ردیف تسویه\n * @param reference مرجع پرداخت بانکی — اختیاری
 */
export async function markSettlementPaid(
  id: string,
  reference?: string,
): Promise<{ id: string; status: string }> {
  return apiPost<{ id: string; status: string }>(
    settlementEndpoints.markPaid(id),
    reference ? { reference } : {},
  );
}
