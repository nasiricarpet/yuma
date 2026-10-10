import { apiGet, apiPost, apiPut } from '../client';
import type {
  Assessment,
  AssessmentListResponse,
  QCSubmission,
  WaitingTimeFilter,
} from '../../types';

/**
 * endpoints مربوط به ارزیابی و کنترل کیفیت سفارش‌ها در پنل قالیشویی
 */
export const orderEndpoints = {
  /** لیست سفارش‌های در انتظار ارزیابی */
  assessmentList: '/orders/assessment',
  /** دریافت ارزیابی یک سفارش */
  assessment: (id: string) => `/orders/${id}/assessment`,
  /** ذخیره یا به‌روزرسانی ارزیابی */
  saveAssessment: (id: string) => `/orders/${id}/assessment`,
  /** ثبت نتیجه کنترل کیفیت */
  submitQC: (id: string) => `/orders/${id}/quality-control`,
  /** آپلود تصاویر سفارش */
  uploadMedia: (id: string) => `/orders/${id}/media`,
} as const;

/**
 * دریافت لیست سفارش‌های در انتظار ارزیابی —
 * `GET {NEXT_PUBLIC_API_URL}/orders/assessment`
 *
 * فیلتر زمان انتظار سمت کلاینت روی داده‌های دریافتی اعمال می‌شود.
 */
export async function getAssessmentList(
  filter: WaitingTimeFilter = 'all',
): Promise<AssessmentListResponse> {
  const response = await apiGet<AssessmentListResponse>(orderEndpoints.assessmentList);
  return {
    ...response,
    rows: applyWaitingTimeFilter(response.rows ?? [], filter),
  };
}

/**
 * دریافت ارزیابی یک سفارش — `GET {NEXT_PUBLIC_API_URL}/orders/:id/assessment`
 *
 * اگر ارزیابی‌ای هنوز ثبت نشده، یک ارزیابی خالی بر اساس اقلام سفارش ساخته می‌شود.
 */
export async function getAssessment(id: string): Promise<Assessment> {
  return apiGet<Assessment>(orderEndpoints.assessment(id));
}

/**
 * ذخیره ارزیابی — `PUT {NEXT_PUBLIC_API_URL}/orders/:id/assessment`
 *
 * @param status `draft` برای پیش‌نویس، `submitted` برای ارسال به مشتری
 */
export async function saveAssessment(
  id: string,
  data: Omit<Assessment, 'orderId' | 'trackingCode' | 'customerName' | 'status'>,
  status: 'draft' | 'submitted' = 'draft',
): Promise<Assessment> {
  return apiPut<Assessment>(orderEndpoints.saveAssessment(id), {
    ...data,
    status,
  });
}

/**
 * ثبت نتیجه کنترل کیفیت —
 * `POST {NEXT_PUBLIC_API_URL}/orders/:id/quality-control`
 *
 * decision با مقدار pass سفارش را به ready_for_delivery و
 * با fail به in_cleaning منتقل می‌کند.
 */
export async function submitQC(id: string, data: QCSubmission): Promise<void> {
  await apiPost(orderEndpoints.submitQC(id), data);
}

/**
 * آپلود تصاویر سفارش —
 * `POST {NEXT_PUBLIC_API_URL}/orders/:id/media` (multipart/form-data)
 *
 * تصاویر قبل از ارسال، EXIF آنها حذف می‌شود.
 */
export async function uploadMedia(
  id: string,
  files: File[],
): Promise<{ media: Array<{ id: string; url: string; fileName: string }> }> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file, file.name));

  return apiPost<{ media: Array<{ id: string; url: string; fileName: string }> }>(
    orderEndpoints.uploadMedia(id),
    formData,
  );
}

/**
 * اعمال فیلتر زمان انتظار روی ردیف‌های لیست.
 *
 * زمان انتظار از تاریخ ورود سفارش به کارگاه محاسبه می‌شود.
 */
function applyWaitingTimeFilter(
  rows: AssessmentListResponse['rows'],
  filter: WaitingTimeFilter,
): AssessmentListResponse['rows'] {
  if (filter === 'all') return rows;

  const HOUR = 3_600_000;
  return rows.filter((row) => {
    const elapsed = Date.now() - new Date(row.arrivedAt).getTime();
    if (filter === 'under_24h') return elapsed < 24 * HOUR;
    if (filter === '24_to_72h')
      return elapsed >= 24 * HOUR && elapsed <= 72 * HOUR;
    return elapsed > 72 * HOUR;
  });
}
