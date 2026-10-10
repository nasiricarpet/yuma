import { apiGet, apiPatch, apiPost } from '../client';
import type {
  PaginatedResponse,
  SupportMessage,
  SupportTicket,
  SupportTicketListParams,
} from '@/types';

/**
 * endpoints مربوط به تیکت‌های پشتیبانی — مسیر /support/tickets
 *
 * نیازمند نقش `admin`، `manager`، `support` یا `expert` است (RolesGuard بک‌اند).
 * برخلاف سایر ماژول‌ها، این مسیر پیشوند `admin` ندارد.
 */
export const supportEndpoints = {
  /** لیست صفحه‌بندی‌شده‌ی تیکت‌ها */
  list: '/support/tickets',
  /** جزئیات یک تیکت + همه‌ی پیام‌ها (شامل پیام‌های داخلی) */
  detail: (id: string) => `/support/tickets/${id}`,
  /** تخصیص تیکت به کارشناس پشتیبانی */
  assign: (id: string) => `/support/tickets/${id}/assign`,
  /** تغییر وضعیت تیکت */
  status: (id: string) => `/support/tickets/${id}/status`,
  /** ثبت پاسخ پشتیبان (عمومی یا داخلی) */
  messages: (id: string) => `/support/tickets/${id}/messages`,
} as const;

/**
 * شکل خام پاسخ لیست بک‌اند — بک‌اند از `items`/`limit` استفاده می‌کند
 * (برخلاف `PaginatedResponse` که `data`/`perPage` دارد).
 */
interface RawSupportList {
  items: SupportTicket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** ساخت پارامترهای query — فقط مقادیر تعریف‌شده و غیرخالی ارسال می‌شوند */
function buildQuery(params?: SupportTicketListParams): string {
  const search = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });

  return search.toString();
}

/**
 * لیست تیکت‌های پشتیبانی — `GET {NEXT_PUBLIC_API_URL}/support/tickets`
 *
 * اولویت‌دارها بالاتر و سپس جدیدترین‌ها می‌آیند. پاسخ به `PaginatedResponse`
 * نرمال می‌شود تا با سایر لیست‌های پنل همخوان باشد.
 */
export async function listSupportTickets(
  params?: SupportTicketListParams,
): Promise<PaginatedResponse<SupportTicket>> {
  const query = buildQuery(params);
  const raw = await apiGet<RawSupportList>(
    query ? `${supportEndpoints.list}?${query}` : supportEndpoints.list,
  );

  return {
    data: raw.items,
    total: raw.total,
    page: raw.page,
    perPage: raw.limit,
    totalPages: raw.totalPages,
  };
}

/** شکل خام پاسخ جزئیات — تیکت در فیلد `ticket` قرار دارد */
interface RawSupportDetail {
  ticket: SupportTicket;
}

/**
 * جزئیات تیکت — `GET {NEXT_PUBLIC_API_URL}/support/tickets/:id`
 *
 * شامل پیام‌های داخلی پشتیبان و نام کامل مشتری/پشتیبان است.
 */
export async function getSupportTicket(id: string): Promise<SupportTicket> {
  const raw = await apiGet<RawSupportDetail>(supportEndpoints.detail(id));

  return raw.ticket;
}

/**
 * تخصیص تیکت — `PATCH {NEXT_PUBLIC_API_URL}/support/tickets/:id/assign`
 *
 * کاربر مشخص‌شده باید یکی از نقش‌های پشتیبانی داشته باشد و فعال باشد.
 */
export async function assignSupportTicket(
  id: string,
  assignedToId: string,
): Promise<SupportTicket> {
  const raw = await apiPatch<RawSupportDetail>(supportEndpoints.assign(id), {
    assignedToId,
  });

  return raw.ticket;
}

/**
 * تغییر وضعیت تیکت — `PATCH {NEXT_PUBLIC_API_URL}/support/tickets/:id/status`
 *
 * گذار مجاز: open → pending_agent → resolved → closed.
 */
export async function updateSupportTicketStatus(
  id: string,
  status: SupportTicket['status'],
  satisfaction?: number,
): Promise<SupportTicket> {
  const raw = await apiPatch<RawSupportDetail>(supportEndpoints.status(id), {
    status,
    satisfaction,
  });

  return raw.ticket;
}

/**
 * ثبت پاسخ پشتیبان — `POST {NEXT_PUBLIC_API_URL}/support/tickets/:id/messages`
 *
 * `visibility: 'internal'` یادداشت خصوصی است که مشتری آن را نمی‌بیند.
 * اولین پاسخ، `firstResponseAt` را پر می‌کند (معیار رعایت SLA).
 */
export async function addSupportMessage(
  id: string,
  body: string,
  visibility: 'public' | 'internal' = 'public',
): Promise<SupportMessage> {
  return apiPost<SupportMessage>(supportEndpoints.messages(id), {
    body,
    visibility,
  });
}
