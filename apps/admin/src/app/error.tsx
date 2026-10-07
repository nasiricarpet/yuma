'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
        <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold">خطایی رخ داد</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          مشکلی در بارگذاری صفحه پیش آمد. می‌توانید دوباره تلاش کنید.
        </p>
      </div>
      <Button onClick={reset}>تلاش مجدد</Button>
    </div>
  );
}
