'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changeRole,
  createStaff,
  deleteStaff,
  listStaff,
  updateStaff,
} from '../endpoints/users';
import { queryKeys } from './keys';
import type { StaffMember, StaffRole } from '@/types';

/**
 * لیست پرسنل — داده‌ها از `listStaff` واکشی می‌شوند.
 *
 * @example
 * const { data: staff, isLoading } = useStaff();
 */
export function useStaff() {
  return useQuery({
    queryKey: queryKeys.staff,
    queryFn: () => listStaff(),
  });
}

/**
 * دادهٔ ساخت کارمند — ایمیل و رمز عبور اختیاری هستند
 * (رمز خالی یعنی ورود با کد یکتا).
 */
export type CreateStaffInput = {
  fullName: string;
  mobile: string;
  email?: string;
  role: StaffRole;
  password?: string;
};

/** ساخت کارمند جدید */
export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStaffInput) => createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff });
    },
  });
}

/** ویرایش کارمند — فقط فیلدهای ارسال‌شده تغییر می‌کنند */
export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        fullName: string;
        email: string;
        role: StaffRole;
        isActive: boolean;
      }>;
    }) => updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff });
    },
  });
}

/** حذف نرم کارمند */
export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff });
    },
  });
}

/** تغییر نقش کارمند */
export function useChangeStaffRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: StaffRole }) =>
      changeRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff });
    },
  });
}

/** فعال یا غیرفعال کردن کارمند */
export function useToggleStaffStatus() {
  const updateStaffMutation = useUpdateStaff();

  return useMutation({
    mutationFn: ({ member }: { member: StaffMember }) =>
      updateStaffMutation.mutateAsync({
        id: member.id,
        data: { isActive: !member.isActive },
      }),
  });
}
