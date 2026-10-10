export const TOKEN_KEY = 'auth-token';

/** آدرس پایه API — از متغیرهای محیطی خوانده می‌شود */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/** خطای استاندارد برای کلاینت API — پیام فارسی برمی‌گرداند */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  signal?: AbortSignal;
  /** نشانه برای جلوگیری از redirect به صفحه ورود */
  skipAuthRedirect?: boolean;
}

/** خواندن توکن احراز هویت — فقط در مرورگر در دسترس است */
function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** حذف توکن و هدایت به ورود در پاسخ ۴۰۱ */
function handleUnauthorized(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* مرورگر ممکن است storage را مسدود کرده باشد */
  }

  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

/** درخواست خام به API — JSON را برمی‌گرداند و خطاها را نرمال می‌کند */
export async function apiFetch<T>(
  path: string,
  init: RequestInit & RequestOptions = {},
): Promise<T> {
  const { signal, skipAuthRedirect, headers, ...rest } = init;

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');

  const token = readToken();
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`);

  // برای multipart، Content-Type را مرورگر خودش تنظیم می‌کند
  const hasBody = rest.body !== undefined && rest.body !== null;
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData;
  if (hasBody && !isFormData) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: requestHeaders,
      signal,
    });
  } catch (cause) {
    // قطعی شبکه یا خاموش بودن سرور — پیامی مناسب برای کاربر قالیشویی
    throw new ApiError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید.', 0, {
      cause,
    });
  }

  if (response.status === 401 && !skipAuthRedirect) {
    handleUnauthorized();
  }

  const text = await response.text();
  const payload = text ? safeParse(text) : null;

  if (!response.ok) {
    const message =
      (typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : undefined) ??
      (typeof payload === 'object' && payload !== null && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : undefined) ??
      defaultErrorMessage(response.status);

    throw new ApiError(message, response.status, payload);
  }

  return (payload ?? ({} as T)) as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function defaultErrorMessage(status: number): string {
  if (status === 403) return 'شما به این بخش دسترسی ندارید.';
  if (status === 404) return 'موردی پیدا نشد.';
  if (status >= 500) return 'خطای سرور. کمی بعد تلاش کنید.';
  return 'درخواست ناموفق بود.';
}

/** درخواست GET */
export function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return apiFetch<T>(path, { ...options, method: 'GET' });
}

/** درخواست POST */
export function apiPost<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return apiFetch<T>(path, {
    ...options,
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** درخواست PUT */
export function apiPut<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return apiFetch<T>(path, {
    ...options,
    method: 'PUT',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
