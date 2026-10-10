import { apiGet, apiPut } from '../client';
import type {
  Setting,
  SettingsListParams,
  SettingsMap,
} from '@/types';

/**
 * endpoints مربوط به تنظیمات سیستم — مسیر /admin/settings
 *
 * نیازمند نقش `admin` است (RolesGuard بک‌اند).
 */
export const settingsEndpoints = {
  /** لیست صفحه‌بندی‌شده‌ی تنظیمات با فیلتر اختیاری دسته */
  list: '/admin/settings',
  /** بروزرسانی مقدار یک تنظیم — upsert بر اساس کلید */
  update: (key: string) => `/admin/settings/${encodeURIComponent(key)}`,
} as const;

/**
 * پوشش استاندارد پاسخ‌های ماژول تنظیمات — `{ success, data }`.
 *
 * برخلاف ماژول سفارش‌ها که از `ok` استفاده می‌کند، اینجا فیلد `success` است.
 */
type SettingsSuccessResponse<T> = { success: true; data: T };

/**
 * باز کردن پوشش پاسخ — اگر بک‌اند داده را در `{ success, data }` فرستاده باشد
 *، خود `data` برمی‌گردد؛ وگرنه همان payload اصلی.
 */
function unwrap<T>(payload: unknown): T {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'success' in payload &&
    (payload as SettingsSuccessResponse<unknown>).success === true &&
    'data' in payload
  ) {
    return (payload as SettingsSuccessResponse<T>).data;
  }

  return payload as T;
}

/**
 * شکل خام پاسخ لیست بک‌اند — بک‌اند از `items`/`limit` استفاده می‌کند
 * (برخلاف `PaginatedResponse` که `data`/`perPage` دارد).
 */
interface RawSettingsList {
  items: Setting[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * ساخت پارامترهای query — فقط مقادیر تعریف‌شده و غیرخالی ارسال می‌شوند.
 */
function buildQuery(params?: SettingsListParams): string {
  const search = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });

  return search.toString();
}

/**
 * لیست تنظیمات — `GET {NEXT_PUBLIC_API_URL}/admin/settings`
 *
 * پاسخ به نقشه‌ی `کلید → مقدار` نرمال می‌شود تا فرم‌ها مستقیماً از کلید
 * بخوانند. در نبود کلید، صفحه از مقدار پیش‌فرض فیلد استفاده می‌کند.
 *
 * @example
 * const settings = await list({ limit: 100 });
 * settings['brand.name']; // → 'قالیشویی یوما'
 */
export async function list(params?: SettingsListParams): Promise<SettingsMap> {
  const query = buildQuery(params);
  const payload = await apiGet<unknown>(
    query ? `${settingsEndpoints.list}?${query}` : settingsEndpoints.list,
  );
  const raw = unwrap<RawSettingsList>(payload);

  return raw.items.reduce<SettingsMap>((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
}

/**
 * بروزرسانی مقدار یک تنظیم — `PUT {NEXT_PUBLIC_API_URL}/admin/settings/:key`
 *
 * اگر تنظیمی با این کلید وجود نداشته باشد ساخته می‌شود (upsert).
 * `updatedAt` رکورد تغییر یافته برای نمایش «آخرین تغییر» در فرم است.
 *
 * @example
 * await update('brand.name', 'قالیشویی یوما');
 */
export async function update(
  key: string,
  value: unknown,
  isPublic?: boolean,
): Promise<Setting> {
  const payload = await apiPut<unknown>(settingsEndpoints.update(key), {
    value,
    ...(isPublic !== undefined ? { isPublic } : {}),
  });

  return unwrap<Setting>(payload);
}
