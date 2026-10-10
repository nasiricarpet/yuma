import { apiDelete, apiGet, apiPatch, apiPost } from '../client';
import type {
  ApiResponse,
  StaffListParams,
  StaffMember,
  StaffRole,
} from '@/types';

/**
 * endpoints مربوط به مدیریت کاربران و پرسنل — مسیر /admin/users
 *
 * نیازمند نقش `admin` است (RolesGuard بک‌اند).
 */
export const userEndpoints = {
  /** لیست صفحه‌بندی‌شده‌ی همه‌ی کاربران */
  list: '/admin/users',
  /** لیست پرسنل عملیاتی */
  staff: '/admin/users/staff',
  /** جزئیات یک کاربر */
  detail: (id: string) => `/admin/users/${id}`,
  /** ساخت کاربر جدید */
  create: '/admin/users',
  /** ویرایش کاربر */
  update: (id: string) => `/admin/users/${id}`,
  /** تغییر نقش کاربر */
  changeRole: (id: string) => `/admin/users/${id}/role`,
  /** حذف نرم کاربر */
  remove: (id: string) => `/admin/users/${id}`,
} as const;

/**
 * پوشش استاندارد پاسخ‌های ماژول کاربران — `{ success, data }`.
 *
 * برخلاف ماژول سفارش‌ها که از `ok` استفاده می‌کند، اینجا فیلد `success` است.
 */
type UsersSuccessResponse<T> = { success: true; data: T };

/**
 * باز کردن پوشش پاسخ — اگر بک‌اند داده را در `{ success, data }` فرستاده باشد
 *، خود `data` برمی‌گردد؛ وگرنی همان payload اصلی.
 */
function unwrap<T>(payload: unknown): T {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'success' in payload &&
    (payload as UsersSuccessResponse<unknown>).success === true &&
    'data' in payload
  ) {
    return (payload as UsersSuccessResponse<T>).data;
  }

  return payload as T;
}

/**
 * لیست پرسنل — `GET {NEXT_PUBLIC_API_URL}/admin/users/staff`
 *
 * بک‌اند همه‌ی پرسنل (admin, manager, expert, support, finance) را
 * برمی‌گرداند، چون مجموعهٔ پرسنل کوچک و عملیاتی است. موبایل ماسک
 * نمی‌شود چون این لیست برای تماس با پرسنل است.
 */
export async function listStaff(
  params?: StaffListParams,
): Promise<StaffMember[]> {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  const payload = await apiGet<unknown>(
    query ? `${userEndpoints.staff}?${query}` : userEndpoints.staff,
  );

  return unwrap<StaffMember[]>(payload);
}

/**
 * ساخت کاربر جدید — `POST {NEXT_PUBLIC_API_URL}/admin/users`
 *
 * رمز عبور اختیاری است: بدون آن کاربر از طریق OTP وارد می‌شود.
 */
export async function createStaff(
  data: Omit<StaffMember, 'id' | 'isActive' | 'createdAt'> & {
    password?: string;
  },
): Promise<StaffMember> {
  const payload = await apiPost<unknown>(userEndpoints.create, {
    mobile: data.mobile,
    fullName: data.fullName,
    role: data.role,
    email: data.email || undefined,
    password: data.password || undefined,
  });

  return unwrap<StaffMember>(payload);
}

/**
 * ویرایش کاربر — `PATCH {NEXT_PUBLIC_API_URL}/admin/users/:id`
 *
 * فقط فیلدهای ارسال‌شده تغییر می‌کنند. موبایل قابل ویرایش نیست.
 */
export async function updateStaff(
  id: string,
  data: Partial<{
    fullName: string;
    email: string;
    role: StaffRole;
    isActive: boolean;
  }>,
): Promise<StaffMember> {
  const payload = await apiPatch<unknown>(userEndpoints.update(id), data);

  return unwrap<StaffMember>(payload);
}

/**
 * حذف نرم کاربر — `DELETE {NEXT_PUBLIC_API_URL}/admin/users/:id`
 *
 * رکورد پاک نمی‌شود؛ `deletedAt` پر می‌شود و حساب غیرفعال می‌گردد.
 */
export async function deleteStaff(id: string): Promise<void> {
  await apiDelete<ApiResponse<Record<string, never>> | unknown>(
    userEndpoints.remove(id),
  );
}

/**
 * تغییر نقش کاربر — `PATCH {NEXT_PUBLIC_API_URL}/admin/users/:id/role`
 */
export async function changeRole(
  id: string,
  role: StaffRole,
): Promise<StaffMember> {
  const payload = await apiPatch<unknown>(userEndpoints.changeRole(id), {
    role,
  });

  return unwrap<StaffMember>(payload);
}
