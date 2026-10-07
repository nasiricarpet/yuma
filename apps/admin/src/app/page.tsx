import { redirect } from 'next/navigation';

/**
 * صفحه اصلی — مستقیماً به داشبورد هدایت می‌شود.
 * ProtectedRoute داخل (dashboard)/layout بررسی نشست را انجام می‌دهد.
 */
export default function RootPage() {
  redirect('/dashboard');
}
