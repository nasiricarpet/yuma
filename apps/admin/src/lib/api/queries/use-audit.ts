'use client';

import { useQuery } from '@tanstack/react-query';
import { getAuditStats, listAudit } from '../endpoints/audit';
import { listKey, queryKeys } from './keys';
import type { AuditListParams } from '@/types';

/**
 * کلید کوئری لیست رویدادها — پارامترها در کلید می‌نشینند تا
 * هر ترکیب فیلتر + صفحه کش جداگانه‌ای داشته باشد.
 */
function auditListKey(params?: AuditListParams) {
  return listKey(queryKeys.auditLog, params);
}

/**
 * لیست صفحه‌بندی‌شده‌ی رویدادهای ممیزی.
 *
 * @example
 * const { data, isLoading } = useAuditLog({ page: 1, action: 'update' });
 */
export function useAuditLog(params?: AuditListParams) {
  return useQuery({
    queryKey: auditListKey(params),
    queryFn: () => listAudit(params),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * آمار رویدادهای ممیزی — تعداد کل و تفکیک بر اساس عمل و نوع موجودیت.
 *
 * فیلترها را مشابه `useAuditLog` پاس دهید تا آمار با لیست همخوان باشد.
 */
export function useAuditStats(params?: AuditListParams) {
  return useQuery({
    queryKey: [...queryKeys.auditLogStats, params ?? {}],
    queryFn: () => getAuditStats(params),
  });
}
