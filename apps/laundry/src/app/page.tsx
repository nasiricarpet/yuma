// این صفحه از کامپوننت‌های کلاینت (JalaliDatePicker با onChange) استفاده می‌کند،
// پس خودش هم باید Client Component باشد.
"use client";

import Link from 'next/link';
import { formatCurrency, formatJalaliDate, toPersianDigits } from '@yuma/persian';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@yuma/types';
import { JalaliDatePicker } from '@yuma/ui';

interface QueueOrder {
  code: string;
  customer: string;
  items: number;
  amountRial: number;
  status: OrderStatus;
  pickupAt: string;
}

const queue: QueueOrder[] = [
  { code: 'YM-1042', customer: 'زهرا محمدی', items: 6, amountRial: 480_000, status: 'pending', pickupAt: '2026-09-30T08:15:00Z' },
  { code: 'YM-1041', customer: 'علی رضایی', items: 3, amountRial: 1_250_000, status: 'washing', pickupAt: '2026-09-30T06:40:00Z' },
];

const toToman = (rial: number): number => Math.round(rial / 10);

export default function LaundryDashboard() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">صف سفارش‌های امروز</h1>
          <Link
            href="/assessment"
            className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
          >
            ارزیابی سفارش‌ها ←
          </Link>
          <p className="mt-1 text-sm text-slate-500">
            {formatJalaliDate(new Date(), 'dddd D MMMM YYYY')}
          </p>
        </div>
        <div className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground">
          {toPersianDigits(queue.length)} سفارش در انتظار
        </div>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <Metric title="وزن امروز" value={`${toPersianDigits('24.5')} کیلوگرم`} />
        <Metric title="تحویل‌شده" value={toPersianDigits(9)} />
        <Metric title="درآمد امروز" value={formatCurrency(2_450_000, 'toman')} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        {queue.map((order) => (
          <article
            key={order.code}
            className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0"
          >
            <div>
              <p className="num font-semibold">{toPersianDigits(order.code)}</p>
              <p className="mt-1 text-sm text-slate-500">
                {order.customer} — {toPersianDigits(order.items)} قلم
              </p>
            </div>
            <div className="text-sm">
              <span className="rounded-full bg-brand-soft px-3 py-1 text-brand">
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className="text-left text-sm">
              <p className="num font-semibold">{formatCurrency(toToman(order.amountRial), 'toman')}</p>
              <p className="num mt-1 text-xs text-slate-500">
                تحویل: {formatJalaliDate(new Date(order.pickupAt), 'YYYY/MM/DD HH:mm')}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">زمان‌بندی تحویل</h2>
        <JalaliDatePicker
          defaultValue={{ jy: 1405, jm: 7, jd: 8 }}
          onChange={() => {
            /* در فاز بعد به سرور وصل می‌شود */
          }}
        />
      </section>
    </main>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="num mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
