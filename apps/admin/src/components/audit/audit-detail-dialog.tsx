'use client';

import { type ReactNode, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { StatusBadge } from '@/components/common/status-badge';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_TONE,
  type AuditLogEntry,
} from '@/types';
import { formatJalaliDateTime } from '@/lib/utils/format';

export type AuditDetailDialogProps = {
  /** رویداد انتخاب‌شده — null یعنی دیالوگ بسته است */
  entry: AuditLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** نقشهٔ شناسهٔ کاربر → نام نمایشی */
  actorNames: Map<string, string>;
};

/**
 * دیالوگ جزئیات رویداد ممیزی — متادیتای رویداد و نمایشگر JSON
 * وضعیت قبل و بعد از تغییر.
 */
export function AuditDetailDialog({
  entry,
  open,
  onOpenChange,
  actorNames,
}: AuditDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        {entry ? (
          <AuditDetailBody entry={entry} actorNames={actorNames} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AuditDetailBody({
  entry,
  actorNames,
}: {
  entry: AuditLogEntry;
  actorNames: Map<string, string>;
}) {
  const actorName = entry.actorId
    ? (actorNames.get(entry.actorId) ?? 'کاربر حذف‌شده')
    : 'سیستم';

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <StatusBadge
            label={AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
            tone={AUDIT_ACTION_TONE[entry.action]}
          />
          <span>{entry.entityType}</span>
        </DialogTitle>
        <DialogDescription>
          {formatJalaliDateTime(entry.createdAt)} — توسط {actorName}
        </DialogDescription>
      </DialogHeader>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        <DetailItem label="بازیگر" value={actorName} />
        <DetailItem label="نقش" value={entry.actorRole ?? '—'} />
        <DetailItem
          label="شناسهٔ بازیگر"
          value={entry.actorId ?? '—'}
          ltr
          mono
        />
        <DetailItem
          label="شناسهٔ موجودیت"
          value={entry.entityId ?? '—'}
          ltr
          mono
        />
        <DetailItem label="IP" value={entry.ip ?? '—'} ltr mono />
        <DetailItem
          label="شناسهٔ درخواست"
          value={entry.requestId ?? '—'}
          ltr
          mono
        />
      </dl>

      <Tabs defaultValue={entry.before ? 'before' : 'after'}>
        <TabsList>
          <TabsTrigger value="before" disabled={entry.before == null}>
            قبل از تغییر
          </TabsTrigger>
          <TabsTrigger value="after" disabled={entry.after == null}>
            بعد از تغییر
          </TabsTrigger>
        </TabsList>

        <TabsContent value="before">
          <JsonViewer value={entry.before} emptyMessage="مقدار قبل از تغییر ثبت نشده است." />
        </TabsContent>

        <TabsContent value="after">
          <JsonViewer value={entry.after} emptyMessage="مقدار بعد از تغییر ثبت نشده است." />
        </TabsContent>
      </Tabs>

      {entry.userAgent ? (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">User-Agent:</span>{' '}
          <span dir="ltr">{entry.userAgent}</span>
        </div>
      ) : null}
    </>
  );
}

function DetailItem({
  label,
  value,
  ltr,
  mono,
}: {
  label: string;
  value: string;
  ltr?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        dir={ltr ? 'ltr' : undefined}
        className={mono ? 'truncate font-mono text-xs' : 'truncate'}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * نمایشگر JSON — مقدار را با تورفتگی و رنگ‌بندی نمایش می‌دهد.
 * ورودی می‌تواند شیء/آرایه/مقدار اولیه یا `null` باشد.
 */
function JsonViewer({
  value,
  emptyMessage,
}: {
  value: unknown;
  emptyMessage: string;
}) {
  const highlighted = useMemo(() => highlightJson(value), [value]);

  if (value == null) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <pre
      dir="ltr"
      className="max-h-80 overflow-auto rounded-md border bg-muted/30 p-4 text-left text-xs leading-relaxed"
    >
      <code>{highlighted}</code>
    </pre>
  );
}

/** الگوی تشخیص توکن‌های JSON برای رنگ‌بندی */
const JSON_TOKEN =
  /("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

/**
 * JSON را به گره‌های React رنگ‌بندی‌شده تبدیل می‌کند —
 * کلیدها، رشته‌ها، اعداد، بولین‌ها و null هر کدام رنگ خود را دارند.
 */
function highlightJson(value: unknown): ReactNode[] {
  const json = JSON.stringify(value, null, 2) ?? 'null';
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of json.matchAll(JSON_TOKEN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) nodes.push(json.slice(lastIndex, start));

    const token = match[0];
    let className: string;

    if (token.startsWith('"')) {
      // کلید اگر با «:» تمام شده باشد
      className = /:\s*$/.test(token)
        ? 'text-foreground'
        : 'text-emerald-600 dark:text-emerald-400';
    } else if (token === 'true' || token === 'false') {
      className = 'text-purple-600 dark:text-purple-400';
    } else if (token === 'null') {
      className = 'text-muted-foreground italic';
    } else {
      className = 'text-amber-600 dark:text-amber-400';
    }

    nodes.push(
      <span key={`token-${key}`} className={className}>
        {token}
      </span>,
    );
    key += 1;
    lastIndex = start + token.length;
  }

  if (lastIndex < json.length) nodes.push(json.slice(lastIndex));

  return nodes;
}
