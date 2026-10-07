/** کلید پیشوندی برای جلوگیری از تداخل با سایر اپ‌ها */
const STORAGE_PREFIX = 'yuma-admin:';

/** خواندن مقدار JSON از localStorage — در خطای سرور safe است */
export function getStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const value = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

/** نوشتن مقدار JSON در localStorage */
export function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // پر بودن حافظه یا حالت خصوصی — نادیده می‌گیریم
  }
}

/** حذف یک کلید از localStorage */
export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    // نادیده می‌گیریم
  }
}
