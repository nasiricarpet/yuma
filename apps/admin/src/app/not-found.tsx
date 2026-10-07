import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold text-yuma-600">۴۰۴</p>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold">صفحه یافت نشد</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          آدرسی که دنبال آن هستید وجود ندارد یا جابه‌جا شده است.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">بازگشت به داشبورد</Link>
      </Button>
    </div>
  );
}
