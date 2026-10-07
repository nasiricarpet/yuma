import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/src/store/auth-store';

/**
 * آدرس پایه API — از متغیر محیطی Expo خوانده می‌شود.
 *
 * در Expo فقط متغیرهای با پیشوند `EXPO_PUBLIC_` در کد سمت کلاینت
 * در دسترس هستند.
 */
const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

/** کلید هدر احراز هویت */
export const AUTH_HEADER = 'Authorization';

/**
 * کلاینت HTTP اپ سفیر — Axios با تزریق خودکار توکن.
 *
 * توکن از استور Zustand خوانده می‌شود و در صورت وجود در هدر
 * `Authorization` قرار می‌گیرد (الگوی یکسان با اپ مشتری).
 */
const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30_000,
});

// تزریق توکن احراز هویت به هر درخواست
apiClient.interceptors.request.use((config) => {
  // getState خواندن همگام از استور — بدون ری‌رندر
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers[AUTH_HEADER] = `Bearer ${token}`;
  }
  return config;
});

/** درخواست GET عمومی */
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.get<T>(url, config);
  return data;
}

/** درخواست POST عمومی */
export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await apiClient.post<T>(url, body, config);
  return data;
}

/** درخواست PATCH عمومی */
export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await apiClient.patch<T>(url, body, config);
  return data;
}

/** درخواست DELETE عمومی */
export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.delete<T>(url, config);
  return data;
}

export default apiClient;
