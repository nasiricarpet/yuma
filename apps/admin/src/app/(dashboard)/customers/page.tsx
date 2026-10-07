'use client';

import { PageHeader } from '@/components/common/page-header';
import { DataTable, type Column } from '@/components/common/data-table';
import { useCustomers } from '@/lib/api/queries/use-customers';
import type { Customer } from '@/types';

const COLUMNS: Column<Customer>[] = [
  {
    key: 'fullName',
    header: 'نام و نام خانوادگی',
    cell: (customer) => customer.fullName ?? '—',
  },
  {
    key: 'mobile',
    header: 'موبایل',
    cell: (customer) => (
      <span dir="ltr">{`0${customer.mobile.replace(/^98/, '')}`}</span>
    ),
  },
  {
    key: 'nationalCode',
    header: 'کد ملی',
    cell: (customer) =>
      customer.nationalCode ? (
        <span dir="ltr">{customer.nationalCode}</span>
      ) : (
        '—'
      ),
  },
];

export default function CustomersPage() {
  const { data: response, isLoading } = useCustomers();
  const customers = response?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="مشتریان"
        description="مدیریت کاربران مشتری پلتفرم"
      />

      <DataTable<Customer>
        columns={COLUMNS}
        data={customers}
        isLoading={isLoading}
        rowKey={(customer) => customer.id}
        emptyTitle="مشتری‌ای وجود ندارد"
        emptyDescription="وقتی مشتری جدیدی ثبت‌نام کند در این جدول نمایش داده می‌شود."
      />
    </div>
  );
}
