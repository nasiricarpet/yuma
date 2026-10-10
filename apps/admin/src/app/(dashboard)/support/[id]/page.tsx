'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowRight,
  EyeOff,
  Lock,
  Send,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAddTicketMessage,
  useAssignTicket,
  useSupportTicket,
  useUpdateTicketStatus,
} from '@/lib/api/queries/use-support';
import { useStaff } from '@/lib/api/queries/use-staff';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type SupportMessageVisibility,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from '@/types';
import { formatJalaliDateTime } from '@/lib/utils/format';
import { getApiErrorMessage } from '@/lib/utils/errors';

/** نقش‌هایی که می‌توانند تیکت دریافت کنند — منطبق با SUPPORT_ROLES بک‌اند */
const SUPPORT_STAFF_ROLES = ['admin', 'manager', 'support', 'expert'] as const;

/** تن رنگی اولویت */
const PRIORITY_TONE: Record<
  SupportTicketPriority,
  'neutral' | 'info' | 'warning' | 'danger'
> = {
  urgent: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};

/** تن رنگی وضعیت */
const STATUS_TONE: Record<
  SupportTicketStatus,
  'neutral' | 'info' | 'success' | 'warning'
> = {
  open: 'warning',
  pending_agent: 'info',
  resolved: 'success',
  closed: 'neutral',
};

/** وضعیت‌های بعدی مجاز برای هر وضعیت فعلی — منطبق با ALLOWED_TRANSITIONS */
const NEXT_STATUSES: Record<SupportTicketStatus, SupportTicketStatus[]> = {
  open: ['pending_agent', 'resolved', 'closed'],
  pending_agent: ['resolved', 'closed'],
  resolved: ['closed', 'open'],
  closed: [],
};

/**
 * جزئیات تیکت پشتیبانی — `GET /support/tickets/:id`
 *
 * شامل بررسهی SLA، تخصیص، تغییر وضعیت و ثبت پاسخ عمومی/داخلی است.
 */
export default function SupportTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ticketId = params.id;

  const { data: ticket, isLoading, isError, error, refetch } =
    useSupportTicket(ticketId);
  const { data: staff } = useStaff();

  const assignTicket = useAssignTicket();
  const updateStatus = useUpdateTicketStatus();
  const addMessage = useAddTicketMessage();

  const [reply, setReply] = useState('');
  const [visibility, setVisibility] =
    useState<SupportMessageVisibility>('public');

  const supportStaff =
    staff?.filter(
      (member) =>
        member.isActive &&
        (SUPPORT_STAFF_ROLES as readonly string[]).includes(member.role),
    ) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="بارگذاری تیکت..." />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            در حال بارگذاری جزئیات تیکت...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="space-y-6">
        <PageHeader title="تیکت یافت نشد" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {getApiErrorMessage(error)}
            <div className="pt-4">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                تلاش دوباره
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isClosed = ticket.status === 'closed';
  const nextStatuses = NEXT_STATUSES[ticket.status];

  /** مهلت SLA گذشته و هنوز پاسخی نرسیده؟ */
  const slaBreached =
    !ticket.firstResponseAt &&
    ticket.slaDueAt &&
    !isClosed &&
    ticket.status !== 'resolved' &&
    new Date(ticket.slaDueAt).getTime() < Date.now();

  /** ارسال پاسخ پشتیبان */
  async function handleReply() {
    const body = reply.trim();
    if (!body) return;

    try {
      await addMessage.mutateAsync({ id: ticketId, body, visibility });
      setReply('');
      toast.success(
        visibility === 'internal'
          ? 'یادداشت داخلی ثبت شد'
          : 'پاسخ شما برای مشتری ارسال شد',
      );
    } catch (submissionError) {
      toast.error(getApiErrorMessage(submissionError));
    }
  }

  /** تخصیص تیکت به کارشناس */
  async function handleAssign(assignedToId: string) {
    try {
      await assignTicket.mutateAsync({ id: ticketId, assignedToId });
      toast.success('تیکت به کارشناس تخصیص یافت');
    } catch (submissionError) {
      toast.error(getApiErrorMessage(submissionError));
    }
  }

  /** تغییر وضعیت تیکت */
  async function handleStatusChange(status: SupportTicketStatus) {
    try {
      await updateStatus.mutateAsync({ id: ticketId, status });
      toast.success(`وضعیت تیکت به «${TICKET_STATUS_LABELS[status]}» تغییر یافت`);
    } catch (submissionError) {
      toast.error(getApiErrorMessage(submissionError));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.subject}
        description={`${TICKET_CATEGORY_LABELS[ticket.category] ?? ticket.category} — ${formatJalaliDateTime(
          ticket.createdAt,
        )}`}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/support')}
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت به لیست
          </Button>
        }
      />

      {/* بج‌های وضعیت و اولویت + هشدار نقض SLA */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          label={TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
          tone={STATUS_TONE[ticket.status]}
        />
        <StatusBadge
          label={`اولویت: ${TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}`}
          tone={PRIORITY_TONE[ticket.priority]}
          dot={false}
        />
        {slaBreached ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/20 dark:bg-red-950 dark:text-red-300">
            <Lock className="h-3 w-3" />
            مهلت پاسخ اولیه نقض شده است
          </span>
        ) : null}
        {ticket.firstResponseAt ? (
          <span className="text-xs text-muted-foreground">
            اولین پاسخ: {formatJalaliDateTime(ticket.firstResponseAt)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            بدون پاسخ — مهلت:{' '}
            {ticket.slaDueAt ? formatJalaliDateTime(ticket.slaDueAt) : '—'}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ستون چپ: اطلاعات تیکت و اقدامات */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات تیکت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">مشتری</span>
                {ticket.customer ? (
                  <div className="flex flex-col">
                    <span>{ticket.customer.fullName}</span>
                    <span dir="ltr" className="text-xs text-muted-foreground">
                      {ticket.customer.mobile}
                    </span>
                  </div>
                ) : (
                  '—'
                )}
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">سفارش مرتبط</span>
                {ticket.order ? (
                  <span dir="ltr" className="text-xs">
                    {ticket.order.trackingCode}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">ندارد</span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">پشتیبان</span>
                {ticket.assignedTo ? (
                  <span>{ticket.assignedTo.fullName}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    تخصیص نیافته
                  </span>
                )}
              </div>

              {ticket.satisfaction ? (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    رضایت مشتری
                  </span>
                  <span>{ticket.satisfaction} از ۵</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>اقدامات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  تخصیص به کارشناس
                </label>
                <Select onValueChange={handleAssign}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب کارشناس..." />
                  </SelectTrigger>
                  <SelectContent>
                    {supportStaff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.fullName} — {member.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  تغییر وضعیت
                </label>
                {nextStatuses.length > 0 ? (
                  <Select onValueChange={(value) => handleStatusChange(value as SupportTicketStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب وضعیت..." />
                    </SelectTrigger>
                    <SelectContent>
                      {nextStatuses.map((value) => (
                        <SelectItem key={value} value={value}>
                          {TICKET_STATUS_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    این تیکت بسته شده و گذار دیگری ندارد.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ستون راست: گفتگو و پاسخ */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>گفتگو</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.messages?.length ? (
                ticket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-lg border p-3 ${
                      message.visibility === 'internal'
                        ? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {message.senderUser?.fullName ?? 'سیستم'}
                      </span>
                      {message.visibility === 'internal' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          <EyeOff className="h-3 w-3" />
                          داخلی
                        </span>
                      ) : null}
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                    <span className="mt-1.5 block text-xs text-muted-foreground">
                      {formatJalaliDateTime(message.createdAt)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  هنوز پیامی در این تیکت ثبت نشده است.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {isClosed ? 'این تیکت بسته شده است' : 'پاسخ به تیکت'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isClosed ? (
                <p className="text-sm text-muted-foreground">
                  برای پاسخ‌دهی، ابتدا وضعیت تیکت را از «بسته‌شده» تغییر دهید.
                </p>
              ) : (
                <>
                  <Textarea
                    placeholder="متن پاسخ..."
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={4}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Select
                      value={visibility}
                      onValueChange={(value) =>
                        setVisibility(value as SupportMessageVisibility)
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">پاسخ به مشتری</SelectItem>
                        <SelectItem value="internal">یادداشت داخلی</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      onClick={handleReply}
                      disabled={!reply.trim() || addMessage.isPending}
                    >
                      <Send className="h-4 w-4" />
                      {addMessage.isPending ? 'در حال ارسال...' : 'ارسال پاسخ'}
                    </Button>
                  </div>

                  {visibility === 'internal' ? (
                    <p className="text-xs text-muted-foreground">
                      یادداشت داخلی فقط برای تیم پشتیبانی قابل‌مشاهده است
                      و مشتری آن را نمی‌بیند.
                    </p>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}