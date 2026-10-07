'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../client';
import { pricingEndpoints } from '../endpoints';
import { fetchOne } from './fetchers';
import { queryKeys } from './keys';
import type { Quotation } from '@/types';

/** پیش‌فاکتور یک سفارش */
export function useQuotation(orderId: string | undefined) {
  return useQuery({
    queryKey: orderId ? queryKeys.quotation(orderId) : ['quotations'],
    queryFn: () => fetchOne<Quotation>(pricingEndpoints.quotationByOrder(orderId as string)),
    enabled: Boolean(orderId),
  });
}

/** تأیید پیش‌فاکتور توسط مشتری/مدیر */
export function useApproveQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => apiPost(pricingEndpoints.approveQuotation(orderId)),
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotation(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}
