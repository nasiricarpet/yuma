'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { list, update } from '../endpoints/settings';
import { queryKeys } from './keys';
import type { SettingsListParams } from '@/types';

/**
 * نقشه‌ی تنظیمات سیستم — کلید → مقدار.
 *
 * @example
 * const { data: settings, isLoading } = useSettings();
 * settings?.['brand.name'];
 */
export function useSettings(params?: SettingsListParams) {
  return useQuery({
    queryKey: params
      ? [...queryKeys.settings, 'list', params]
      : [...queryKeys.settings, 'list'],
    queryFn: () => list(params),
  });
}

/** ورودی mutation بروزرسانی تنظیم */
export type UpdateSettingInput = {
  /** کلید تنظیم — مثلاً `brand.name` */
  key: string;
  /** مقدار جدید (هر JSON معتبر) */
  value: unknown;
  /** تغییر پرچم عمومی بودن (اختیاری) */
  isPublic?: boolean;
};

/**
 * بروزرسانی یک تنظیم — کش تنظیمات پس از موفقیت نامعتبر می‌شود
 * تا فرم مقدار تازه‌ی سرور را دریافت کند.
 *
 * @example
 * const { mutateAsync, isPending } = useUpdateSetting();
 * await mutateAsync({ key: 'brand.name', value: 'قالیشویی یوما' });
 */
export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value, isPublic }: UpdateSettingInput) =>
      update(key, value, isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}
