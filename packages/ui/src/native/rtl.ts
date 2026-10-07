import { I18nManager } from 'react-native';

/**
 * فعال‌سازی راست‌به‌چپ در React Native.
 *
 * نکته: تغییر `forceRTL` فقط پس از راه‌اندازی مجدد اپ اثر می‌گذارد. در Expo،
 * مقدار `expo.extra.forcesRTL` در app.json این کار را پیش از اولین استارت انجام
 * می‌دهد؛ این تابع برای اطمینان در اجرای Runtime است.
 */
export function enableRTL(): void {
  if (!I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    // eslint-disable-next-line no-console
    console.warn('RTL فعال شد؛ برای اعمال کامل، اپ را یک‌بار ریلود کنید.');
  }
}

/** جهت پیش‌فرض چیدمان همه اپ‌های موبایل */
export const APP_DIRECTION = 'rtl' as const;
