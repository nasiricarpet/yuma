import apiClient from '../client';
import type { Order, OrderAddress, OrderItem } from '@yuma/types';

/**
 * مسیرهای سفارش — نسبت به `EXPO_PUBLIC_API_URL`:
 *  - POST {EXPO_PUBLIC_API_URL}/orders → ثبت سفارش جدید
 */
export const orderEndpoints = {
  /** ثبت سفارش جدید */
  create: '/orders',
  /** لیست سفارش‌های مشتری */
  list: '/orders',
  /** لیست سفارش‌های مشتریِ فعلی */
  my: '/orders/my',
  /** جزئیات یک سفارش بر اساس شناسه */
  byId: (id: string) => `/orders/${id}`,
} as const;

/**
 * داده ارسالی ثبت سفارش — دقیقاً مطابق `CreateOrderDto` بک‌اند.
 *
 * قیمت‌ها روی سرور از دیتابیس محاسبه می‌شوند، پس کلاینت `unitPrice`
 * نمی‌فرستد. `phone` و `notes` نیز جزو DTO نیستند (سرور آن‌ها را با
 * `forbidNonWhitelisted` رد می‌کند)؛ یادداشت کاربر به فیلد `description`
 * نگاشت می‌شود.
 */
export interface SubmitOrderPayload {
  /** شناسه‌ی مشتریِ لاگین‌شده — از استور احراز هویت */
  customerId: string;
  /** شناسه‌ی قالیشویی مقصد — UUID معتبر */
  laundryId: string;
  /** توضیحات اختیاری مشتری درباره‌ی سفارش */
  description?: string;
  /** بازه‌ی زمانی اختیاری برداشت */
  pickupTimeSlot?: string;
  /** آدرس برداشت فرش */
  address: Pick<
    OrderAddress,
    'province' | 'city' | 'postalCode' | 'fullAddress' | 'latitude' | 'longitude'
  >;
  /** اقلام سفارش — حداقل یک قلم، شناسه‌ی سرویس UUID است */
  items: Array<Pick<OrderItem, 'serviceId' | 'quantity' | 'areaSqm'>>;
}

/** پاسخ موفق ثبت سفارش */
export interface SubmitOrderResponse {
  /** سفارش ثبت‌شده */
  order: Order;
  /** پیام نمایشی برای کاربر */
  message?: string;
}

/**
 * ثبت سفارش نهایی مشتری
 *
 * @example
 * const { order } = await submitOrder({
 *   customerId: 'uuid',
 *   laundryId: 'uuid',
 *   items: [{ serviceId: 'uuid', quantity: 2 }],
 *   address: { province: 'تهران', city: 'تهران', fullAddress: '...', postalCode: '...' },
 * });
 */
export async function submitOrder(data: SubmitOrderPayload): Promise<SubmitOrderResponse> {
  const { data: response } = await apiClient.post<SubmitOrderResponse>(
    orderEndpoints.create,
    data,
  );
  return response;
}

/**
 * لیست سفارش‌های مشتریِ فعلی
 *
 * ممکن است یک آرایه یا `{ data: Order[] }` برگردد — هر دو هندل می‌شود.
 *
 * @example
 * const orders = await getMyOrders();
 */
export async function getMyOrders(): Promise<Order[]> {
  const { data } = await apiClient.get<Order[] | { data: Order[] }>(
    orderEndpoints.my,
  );
  return Array.isArray(data) ? data : data.data;
}

/**
 * جزئیات کامل یک سفارش بر اساس شناسه
 *
 * @example
 * const order = await getOrderById('ord_123');
 */
export async function getOrderById(id: string): Promise<Order> {
  const { data } = await apiClient.get<Order>(orderEndpoints.byId(id));
  return data;
}
