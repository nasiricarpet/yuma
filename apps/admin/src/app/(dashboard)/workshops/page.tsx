'use client';

import { PageHeader } from '@/components/common/page-header';
import { DataTable, type Column } from '@/components/common/data-table';
import { useLaundries } from '@/lib/api/queries/use-laundries';
import type { Workshop } from '@/types';

const COLUMNS: Column<Workshop>[] = [
  { key: 'name', header: 'نام کارگاه', cell: (laundry) => laundry.name },
  {
    key: 'city',
    header: 'شهر',
    cell: (laundry) => laundry.city ?? '—',
  },
  {
    key: 'phone',
    header: 'تلفن',
    cell: (laundry) =>
      laundry.phone ? <span dir="ltr">{laundry.phone}</span> : '—',
  },
];

export default function WorkshopsPage() {
  const { data: response, isLoading } = useLaundries();
  const laundries = response?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="کارگاه‌ها"
        description="مدیریت قالیشویی‌های همکار پلتفرم"
      />

      <DataTable<Workshop>
        columns={COLUMNS}
        data={laundries}
        isLoading={isLoading}
        rowKey={(laundry) => laundry.id}
        emptyTitle="کارگاهی وجود ندارد"
        emptyDescription="وقتی کارگاه جدیدی اضافه شود در این جدول نمایش داده می‌شود."
      />
    </div>
  );
}
