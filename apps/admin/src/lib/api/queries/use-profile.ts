'use client';

import { useQuery } from '@tanstack/react-query';
import { authEndpoints } from '../endpoints';
import { fetchOne } from './fetchers';
import { queryKeys } from './keys';
import type { AdminUser } from '@/types';

/** پروفایل کاربر فعلی — برای نمایش در منوی کاربر */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => fetchOne<AdminUser>(authEndpoints.me),
    staleTime: 5 * 60 * 1000,
  });
}
