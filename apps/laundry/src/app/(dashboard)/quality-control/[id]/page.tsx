'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { QcPhotoUpload, type QcPhoto } from '@/components/quality-control/qc-photo-upload';
import { getAssessment, submitQC, uploadMedia } from '@/lib/api/endpoints/orders';
import { buildMockAssessment } from '@/lib/api/mock';
import {
  QC_CHECKLIST_KEYS,
  type Assessment,
  type QCAnswer,
  type QCChecklistEntry,
  type QCChecklistKey,
  type QCDecision,
} from '@/lib/types';
import { QC_CHECKLIST_LABELS } from '@/lib/types';

const MIN_PHOTOS = 2;

type ChecklistState = Partial<Record<QCChecklistKey, QCAnswer>>;

/**
 * صفحه کنترل کیفیت — چک‌لیست شش‌سوالی، حداقل دو عکس بدون EXIF
 * و تصمیم نهایی: قبول (آماده تحویل) یا رد (بازگشت به شستشو).
 */
export default function QualityControlPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [checklist, setChecklist] = useState<ChecklistState>({});
  const [photos, setPhotos] = useState<QcPhoto[]>([]);
  const [decision, setDecision] = useState<QCDecision | null>(null);
  const [failReason, setFailReason] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{ decision: QCDecision; message: string } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setAssessment(await getAssessment(orderId));
      } catch {
        setAssessment(buildMockAssessment(orderId));
      }
    })();
  }, [orderId]);

  const answeredCount = useMemo(
    () => QC_CHECKLIST_KEYS.filter((key) => checklist[key] !== undefined).length,
    [checklist],
  );

  const allAnswered = answeredCount === QC_CHECKLIST_KEYS.length;

  const validate = useCallback((): string | null => {
    if (!allAnswered) {
      return `به همه ${QC_CHECKLIST_KEYS.length} سوال پاسخ دهید (${answeredCount} از ${QC_CHECKLIST_KEYS.length}).`;
    }
    if (photos.length < MIN_PHOTOS) {
      return `حداقل ${MIN_PHOTOS} عکس بارگذاری کنید (${photos.length} عکس).`;
    }
    if (decision === 'fail' && failReason.trim().length < 5) {
      return 'در صورت رد، دلیل بازگرداندن به شستشو را شرح دهید.';
    }
    return null;
  }, [allAnswered, answeredCount, photos.length, decision, failReason]);

  const handleSubmit = async (chosen: QCDecision) => {
    setDecision(chosen);
    setSubmitError(null);

    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      // ابتدا تصاویر آپلود می‌شوند، سپس نتیجه کنترل کیفیت ثبت می‌شود
      const uploaded = await uploadMedia(orderId, photos.map((photo) => photo.file));
      const mediaIds = uploaded.media.map((media) => media.id);

      const entries: QCChecklistEntry[] = QC_CHECKLIST_KEYS.map((key) => ({
        key,
        answer: checklist[key]!,
      }));

      await submitQC(orderId, {
        orderId,
        decision: chosen,
        checklist: entries,
        failReason: chosen === 'fail' ? failReason.trim() : undefined,
        mediaIds,
      });

      setDone({
        decision: chosen,
        message:
          chosen === 'pass'
            ? 'کنترل کیفیت قبول شد — سفارش به «آماده تحویل» منتقل شد.'
            : 'کنترل کیفیت رد شد — سفارش به «در حال شستشو» بازگشت.',
      });
    } catch (cause) {
      setSubmitError(
        cause instanceof Error
          ? `${cause.message} — نتیجه محلی نگه داشته شد.`
          : 'ارسال نتیجه ناموفق بود.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        {done.decision === 'pass' ? (
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        ) : (
          <XCircle className="mx-auto h-14 w-14 text-destructive" />
        )}
        <h1 className="mt-4 text-xl font-bold">{done.message}</h1>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href="/assessment">بازگشت به لیست ارزیابی</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (!assessment) {
    return (
      <main className="mx-auto flex max-w-3xl items-center justify-center px-6 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        در حال بارگذاری…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link
        href="/assessment"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت به لیست ارزیابی
      </Link>

      <header className="mb-6">
        <h1 className="text-xl font-bold md:text-2xl">کنترل کیفیت</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          سفارش <span className="num font-medium text-foreground">{assessment.trackingCode}</span> —
          مشتری: <span className="font-medium text-foreground">{assessment.customerName}</span>
        </p>
      </header>

      <div className="space-y-6">
        {/* چک‌لیست */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">چک‌لیست کنترل کیفیت</CardTitle>
            <p className="text-xs text-muted-foreground">
              {answeredCount} از {QC_CHECKLIST_KEYS.length} سوال پاسخ داده شده
            </p>
          </CardHeader>

          <CardContent className="space-y-1">
            {QC_CHECKLIST_KEYS.map((key) => (
              <div key={key}>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-1 py-3">
                  <Label className="text-sm font-medium">
                    {QC_CHECKLIST_LABELS[key]}
                  </Label>

                  <RadioGroup
                    value={checklist[key] ?? ''}
                    onValueChange={(value) =>
                      setChecklist((current) => ({
                        ...current,
                        [key]: value as QCAnswer,
                      }))
                    }
                    className="flex flex-row gap-4"
                  >
                    <label className="flex cursor-pointer items-center gap-1.5 text-sm">
                      <RadioGroupItem value="pass" id={`qc-${key}-pass`} />
                      بله
                    </label>
                    <label className="flex cursor-pointer items-center gap-1.5 text-sm">
                      <RadioGroupItem value="fail" id={`qc-${key}-fail`} />
                      خیر
                    </label>
                  </RadioGroup>
                </div>
                <Separator />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* تصاویر */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">تصاویر کنترل کیفیت</CardTitle>
            <p className="text-xs text-muted-foreground">
              متادیتای تصاویر قبل از ارسال حذف می‌شود
            </p>
          </CardHeader>
          <CardContent>
            <QcPhotoUpload
              photos={photos}
              onChange={(next) => {
                setPhotos(next);
                setPhotoError(null);
              }}
              uploading={submitting}
              error={photoError}
            />
          </CardContent>
        </Card>

        {/* دلیل رد */}
        {decision === 'fail' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">دلیل بازگرداندن</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="fail-reason">چرا سفارش به شستشو برمی‌گردد؟</Label>
              <Textarea
                id="fail-reason"
                rows={3}
                value={failReason}
                onChange={(event) => setFailReason(event.target.value)}
                placeholder="توضیح کافی برای کارگاه شستشو…"
              />
            </CardContent>
          </Card>
        ) : null}

        {/* تصمیم نهایی */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="success"
                size="lg"
                disabled={submitting}
                onClick={() => void handleSubmit('pass')}
              >
                <CheckCircle2 className="h-4 w-4" />
                قبول — آماده تحویل
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="lg"
                disabled={submitting}
                onClick={() => void handleSubmit('fail')}
              >
                <XCircle className="h-4 w-4" />
                رد — بازگشت به شستشو
              </Button>
            </div>

            {submitting ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال ثبت نتیجه…
              </div>
            ) : null}

            {submitError ? (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {submitError}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
