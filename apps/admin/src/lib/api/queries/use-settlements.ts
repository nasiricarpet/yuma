'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listSettlements,
  markSettlementPaid,
  previewSettlement,
} from '../endpoints/settlements';
import { listKey, queryKeys } from './keys';
import type { SettlementListParams } from '@/types';

/**
 * لیست تسویه‌ی کارگاه‌ها — داده‌ها از `listSettlements` واکشی می‌شوند.
 *
 * @example
 * const { data, isLoading } = useSettlements({ status: 'pending' });
 * const settlements = data?.data ?? [];
 */
export function useSettlements(params?: SettlementListParams) {
  return useQuery({
    queryKey: listKey(queryKeys.settlements, params),
    queryFn: () => listSettlements(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * محاسبه‌ی زنده‌ی تسویه‌ی یک دوره — ردیف را upsert می‌کند.
 *
 * @example
 * const { mutateAsync } = usePreviewSettlement();
 * await mutateAsync({ workshopId, month: '2026-09' });
 */
export function usePreviewSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workshopId, month }: { workshopId: string; month: string }) =>
      previewSettlement(workshopId, month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements });
    },
  });
}

/**
 * علامت‌گذاری تسویه به‌عنوان پرداخت‌شده —
 * کش لیست تسویه‌ها پس از موفقیت نامعتبر می‌شود.
 *
 * @example
 * const { mutate, isPending } = useMarkSettlementPaid();
 * mutate({ id: settlement.id, reference: 'TRANSFER-99' });
 */
export function useMarkSettlementPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reference }: { id: string; reference?: string }) =>
      markSettlementPaid(id, reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements });
    },
  });
}
