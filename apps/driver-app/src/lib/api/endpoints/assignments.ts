import { apiGet, apiPatch } from '../client';
import type { OrderStatus } from '@yuma/types';

/**
 * یک وظیفه (Assignment) محول‌شده به سفیر — نمایندگی از یک سفارش
 * در فرآیند لجستیک، از دید اپ راننده.
 */
export interface Assignment {
  /** شناسه یکتای وظیفه */
  id: string;
  /** کد پیگیری سفارش (شماره سفارش) */
  trackingCode: string;
  /** نوع درخواست/خدمت — مثلاً «قالی شستشو» یا «پتو» */
  serviceType: string;
  /** آدرس مشتری — محل دریافت یا تحویل */
  customerAddress: string;
  /** آدرس کارگاه قالیشویی مقصد */
  workshopAddress: string;
  /** وضعیت فعلی جریان لجستیک */
  status: OrderStatus;
}

/**
 * موقعیت مکانی اختیاری هنگام تغییر وضعیت — برای ردپای تحویل.
 */
export interface DriverLocation {
  latitude: number;
  longitude: number;
}

/**
 * مسیرهای وظایف سفیر — نسبت به `EXPO_PUBLIC_API_URL`:
 *  - GET   {EXPO_PUBLIC_API_URL}/assignments/my      → لیست وظایف محول‌شده
 *  - PATCH {EXPO_PUBLIC_API_URL}/assignments/:id/status → تغییر وضعیت
 */
export const assignmentEndpoints = {
  /** لیست وظایف محول‌شده به سفیرِ فعلی */
  myAssignments: '/assignments/my',
  /** تغییر وضعیت یک وظیفه */
  updateStatus: (assignmentId: string) => `/assignments/${assignmentId}/status`,
} as const;

/**
 * دریافت لیست وظایف محول‌شده به سفیرِ واردشده.
 *
 * @example
 * const assignments = await getMyAssignments();
 */
export async function getMyAssignments(): Promise<Assignment[]> {
  return apiGet<Assignment[]>(assignmentEndpoints.myAssignments);
}

/**
 * تغییر وضعیت یک وظیفه — با ثبت اختیاری موقعیت مکانی.
 *
 * @example
 * await updateAssignmentStatus('a1', 'picked_up');
 * await updateAssignmentStatus('a1', 'delivered', { latitude: 35.7, longitude: 51.4 });
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  newStatus: OrderStatus,
  location?: DriverLocation,
): Promise<void> {
  await apiPatch<void>(
    assignmentEndpoints.updateStatus(assignmentId),
    location ? { status: newStatus, location } : { status: newStatus },
  );
}
