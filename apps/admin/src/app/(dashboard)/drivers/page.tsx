'use client';

import { PageHeader } from '@/components/common/page-header';
import { DataTable, type Column } from '@/components/common/data-table';
import { StatusBadge } from '@/components/common/status-badge';
import { useDrivers } from '@/lib/api/queries/use-drivers';
import type { Driver } from '@/types';

/** برچسب فارسی نوع وسیله نقلیه — منطبق با enum VehicleType در schema.prisma */
const VEHICLE_TYPE_LABELS: Record<string, string> = {
  motorcycle: 'موتور',
  car: 'خودرو',
  van: 'وانت',
};

const COLUMNS: Column<Driver>[] = [
  {
    key: 'plateNumber',
    header: 'شماره پلاک',
    cell: (driver) =>
      driver.plateNumber ? (
        <span dir="ltr">{driver.plateNumber}</span>
      ) : (
        '—'
      ),
  },
  {
    key: 'vehicleType',
    header: 'نوع وسیله نقلیه',
    cell: (driver) =>
      VEHICLE_TYPE_LABELS[driver.vehicleType ?? ''] ??
      driver.vehicleType ??
      '—',
  },
  {
    key: 'isActive',
    header: 'وضعیت فعالیت',
    cell: (driver) => (
      <StatusBadge
        label={driver.isActive ? 'اکتیو' : 'غیر اکتیو'}
        tone={driver.isActive ? 'success' : 'neutral'}
        dot
      />
    ),
  },
];

export default function DriversPage() {
  const { data: response, isLoading } = useDrivers();
  const drivers = response?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="سفیران"
        description="مدیریت رانندگان و وضعیت فعالیت آن‌ها"
      />

      <DataTable<Driver>
        columns={COLUMNS}
        data={drivers}
        isLoading={isLoading}
        rowKey={(driver) => driver.id}
        emptyTitle="سفیری وجود ندارد"
        emptyDescription="وقتی سفیر جدیدی ثبت شود در این جدول نمایش داده می‌شود."
      />
    </div>
  );
}
