'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { toEnglishDigits } from '@yuma/persian';
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
import { requestOtp } from '@/lib/api/endpoints/auth';

/** تبدیل به فرمت استاندارد 09xxxxxxxxx و اعتبارسنجی ساده */
function normalizeMobile(value: string): string {
  return toEnglishDigits(value).replace(/\s/g, '').replace(/^\+?98/, '0');
}

function isValidMobile(mobile: string): boolean {
  return /^09\d{9}$/.test(mobile);
}

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalized = normalizeMobile(mobile);
    if (!isValidMobile(normalized)) {
      setError('شماره موبایل معتبر نیست — مثال: ۰۹۱۲۳۴۵۶۷۸۹');
      return;
    }
    setError(null);

    setSubmitting(true);
    try {
      await requestOtp(normalized);
      toast.success('کد یکتا ارسال شد');
      // شماره را برای مرحله تأیید نگه می‌داریم
      sessionStorage.setItem('pending-mobile', normalized);
      router.push('/otp');
    } catch {
      toast.error('ارسال کد یکتا ناموفق بود. دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">ورود به پنل ادمین</CardTitle>
        <CardDescription>
          برای ادامه، شماره موبایل خود را وارد کنید
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mobile">شماره موبایل</Label>
            <Input
              id="mobile"
              type="tel"
              inputMode="numeric"
              dir="ltr"
              className="text-left"
              placeholder="09123456789"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
              disabled={submitting}
            />
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || mobile.trim().length === 0}
          >
            {submitting ? 'در حال ارسال…' : 'دریافت کد یکتا'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
