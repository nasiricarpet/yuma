'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch, apiPost } from '../client';
import { orderEndpoints } from '../endpoints';
import { queryKeys } from './keys';
import type { OrderStatus } from '@/types';

/** تغییر وضعیت سفارش */
export function useChangeOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: OrderStatus; note?: string }) =>
      apiPatch(orderEndpoints.changeStatus(id), { status, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

/** لغو سفارش */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiPost(orderEndpoints.cancel(id), { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}
