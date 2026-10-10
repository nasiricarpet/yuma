import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { getStorage, removeStorage } from '../utils/storage';

/** کلید ذخیره توکن احراز هویت */
export const TOKEN_KEY = 'auth-token';

/** آدرس پایه API — از متغیرهای محیطی خوانده می‌شود */
const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/**
 * کلاینت HTTP اپ ادمین — Axios با تزریق خودکار توکن
 *
 * خطاهای ۴۰۱ توکن را پاک کرده و به صفحه ورود هدایت می‌کند.
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
  const token = getStorage<string>(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// مدیریت متمرکز خطاها — ۴۰۱ یعنی نشست منقضی شده
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      removeStorage(TOKEN_KEY);
      // جلوگیری از لوپ در صفحه ورود
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

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

/** درخواست PUT عمومی */
export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await apiClient.put<T>(url, body, config);
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
