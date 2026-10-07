'use client';

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './auth-provider';

/**
 * هوک دسترسی به وضعیت احراز هویت
 *
 * @example
 * const { user, isAuthenticated, logout } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  return context ?? defaultNull;
}

/** مقدار fallback — زمانی که Provider هنوز mount نشده */
const defaultNull = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setSession: () => {},
  logout: () => {},
} as const;
