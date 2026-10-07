'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { verifyOtp } from '@/lib/api/endpoints/auth';
import { TOKEN_KEY } from '@/lib/api/client';
import { setStorage } from '@/lib/utils/storage';
import { useAuth } from '@/lib/auth/use-auth';

export default function OtpPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [code, setCode] = useState('');
  const [mobile, setMobile] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // شماره موبایل از مرحله قبل — بدون آن به صفحه ورود برمی‌گردیم
  useEffect(() => {
    const pending = sessionStorage.getItem('pending-mobile');
    if (!pending) {
      router.replace('/login');
      return;
    }
    setMobile(pending);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || code.length !== 6) return;

    setSubmitting(true);
    try {
      const response = await verifyOtp(mobile, code);

      if (!response.token || !response.user) {
        toast.error('کد یکتا نادرست است');
        return;
      }

      // پاک‌سازی شماره معلق
      sessionStorage.removeItem('pending-mobile');

      // ذخیره توکن برای کلاینت API (هدر Authorization)
      setStorage(TOKEN_KEY, response.token);

      // ثبت نشست در Zustand — با persist در localStorage ذخیره می‌شود
      setSession(
        {
          id: response.user.id,
          mobile: response.user.mobile,
          role: response.user.role,
          fullName: response.user.fullName,
        },
        response.token,
      );

      toast.success('خوش آمدید');
      router.replace('/dashboard');
    } catch {
      toast.error('تأیید کد یکتا ناموفق بود. دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">تأیید کد یکتا</CardTitle>
        <CardDescription>
          کد ۶ رقمی ارسال شده به شماره{' '}
          <span dir="ltr" className="font-medium text-foreground">
            {mobile ? `0${mobile.replace(/^98/, '')}` : '—'}
          </span>{' '}
          را وارد کنید
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp-code">کد یکتا</Label>
            <Input
              id="otp-code"
              inputMode="numeric"
              dir="ltr"
              className="text-center text-lg tracking-widest"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="------"
              autoFocus
              disabled={submitting}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || code.length !== 6}
          >
            {submitting ? 'در حال تأیید…' : 'ورود'}
          </Button>

          <Button
            type="button"
            variant="link"
            className="w-full text-sm"
            onClick={() => router.replace('/login')}
          >
            تغییر شماره موبایل
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
