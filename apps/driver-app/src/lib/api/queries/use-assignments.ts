import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  getMyAssignments,
  updateAssignmentStatus,
  type Assignment,
  type DriverLocation,
} from '../endpoints/assignments';
import { queryKeys } from './keys';
import type { OrderStatus } from '@yuma/types';

/**
 * لیست وظایف محول‌شده به سفیرِ واردشده.
 *
 * @example
 * const { data: assignments, isLoading, refetch } = useMyAssignments();
 */
export function useMyAssignments() {
  return useQuery({
    queryKey: queryKeys.myAssignments,
    queryFn: getMyAssignments,
    placeholderData: keepPreviousData,
  });
}

/**
 * تغییر وضعیت یک وظیفه — پس از موفقیت، لیست وظایف invalidate می‌شود
 * تا داده‌ی کش‌شده از سرور دوباره دریافت و کارت‌ها بروز شوند.
 *
 * @example
 * const { mutateAsync, isPending } = useUpdateAssignmentStatus();
 * await mutateAsync({ assignmentId: 'a1', newStatus: 'picked_up' });
 */
export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assignmentId,
      newStatus,
      location,
    }: {
      assignmentId: string;
      newStatus: OrderStatus;
      location?: DriverLocation;
    }) => updateAssignmentStatus(assignmentId, newStatus, location),
    // رفرش لیست وظایف پس از هر تغییر وضعیت موفق
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myAssignments });
    },
  });
}

export type { Assignment };
