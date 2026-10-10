'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addSupportMessage,
  assignSupportTicket,
  getSupportTicket,
  listSupportTickets,
  updateSupportTicketStatus,
} from '../endpoints/support';
import { listKey, queryKeys } from './keys';
import type {
  SupportMessageVisibility,
  SupportTicket,
  SupportTicketListParams,
  SupportTicketStatus,
} from '@/types';

/**
 * لیست تیکت‌های پشتیبانی — داده‌ها از `listSupportTickets` واکشی می‌شوند.
 * @example
 * const { data, isLoading } = useSupportTickets({ status: 'open' });
 * const tickets = data?.data ?? [];
 */
export function useSupportTickets(params?: SupportTicketListParams) {
  return useQuery({
    queryKey: listKey(queryKeys.supportTickets, params),
    queryFn: () => listSupportTickets(params),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * جزئیات یک تیکت + همه‌ی پیام‌ها (شامل پیام‌های داخلی).
 *
 * @example
 * const { data: ticket, isLoading } = useSupportTicket(id);
 */
export function useSupportTicket(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.supportTicket(id) : ['support', 'tickets', 'missing'],
    queryFn: () => getSupportTicket(id as string),
    enabled: typeof id === 'string' && id.length > 0,
  });
}

/** نامعتبر کردن کش لیست و جزئیات تیکت پس از یک تغییر */
function invalidateSupport(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets });
  if (id) {
    queryClient.invalidateQueries({ queryKey: queryKeys.supportTicket(id) });
  }
}

/**
 * تخصیص تیکت به کارشناس پشتیبانی —
 * کش لیست و جزئیات پس از موفقیت نامعتبر می‌شود.
 *
 * @example
 * const { mutateAsync } = useAssignTicket();
 * await mutateAsync({ id, assignedToId });
 */
export function useAssignTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string }) =>
      assignSupportTicket(id, assignedToId),
    onSuccess: (_data, { id }) => invalidateSupport(queryClient, id),
  });
}

/**
 * تغییر وضعیت تیکت —
 * گذار مجاز: open → pending_agent → resolved → closed.
 *
 * @example
 * const { mutateAsync } = useUpdateTicketStatus();
 * await mutateAsync({ id, status: 'resolved' });
 */
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      satisfaction,
    }: {
      id: string;
      status: SupportTicketStatus;
      satisfaction?: number;
    }) => updateSupportTicketStatus(id, status, satisfaction),
    onSuccess: (ticket: SupportTicket) =>
      invalidateSupport(queryClient, ticket.id),
  });
}

/**
 * ثبت پاسخ پشتیبان —
 * `visibility: 'internal'` یادداشت خصوصی است که مشتری آن را نمی‌بیند.
 *
 * @example
 * const { mutateAsync } = useAddTicketMessage();
 * await mutateAsync({ id, body: 'در حال بررسی...', visibility: 'public' });
 */
export function useAddTicketMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
      visibility = 'public',
    }: {
      id: string;
      body: string;
      visibility?: SupportMessageVisibility;
    }) => addSupportMessage(id, body, visibility),
    onSuccess: (_data, { id }) => invalidateSupport(queryClient, id),
  });
}