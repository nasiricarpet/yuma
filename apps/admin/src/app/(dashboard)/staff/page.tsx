'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { DataTable, type Column } from '@/components/common/data-table';
import { StatusBadge } from '@/components/common/status-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { StaffFormDialog } from '@/components/staff/staff-form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth/use-auth';
import {
  useChangeStaffRole,
  useDeleteStaff,
  useStaff,
  useToggleStaffStatus,
} from '@/lib/api/queries/use-staff';
import { formatJalali, toFa } from '@/lib/utils/format';
import { getApiErrorMessage } from '@/lib/utils/errors';
import {
  STAFF_ROLES,
  STAFF_ROLE_LABELS,
  STAFF_ROLE_TONE,
  type StaffMember,
  type StaffRole,
} from '@/types';

/** مقدار فیلتر وضعیت — همه / فعال / غیرفعال */
type StatusFilter = 'all' | 'active' | 'inactive';

/** موبایل ذخیره‌شده را به شکل نمایشی 09xxxxxxxxx درمی‌آورد */
function displayMobile(mobile: string): string {
  return mobile.startsWith('98') ? `0${mobile.slice(2)}` : mobile;
}

export default function StaffPage() {
  const { data: staff, isLoading, isError, refetch } = useStaff();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  const toggleStatus = useToggleStaffStatus();
  const changeRole = useChangeStaffRole();
  const removeStaff = useDeleteStaff();

  const allStaff = useMemo(() => staff ?? [], [staff]);
  const hasFilter = search !== '' || roleFilter !== 'all' || statusFilter !== 'all';

  // فیلترها سمت کلاینت اعمال می‌شوند — مجموعهٔ پرسنل کوچک و عملیاتی است
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allStaff.filter((member) => {
      if (roleFilter !== 'all' && member.role !== roleFilter) return false;

      if (
        (statusFilter === 'active' && !member.isActive) ||
        (statusFilter === 'inactive' && member.isActive)
      ) {
        return false;
      }

      if (!query) return true;

      return (
        member.fullName.toLowerCase().includes(query) ||
        displayMobile(member.mobile).includes(query) ||
        (member.email?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [allStaff, search, roleFilter, statusFilter]);

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (member: StaffMember) => {
    setEditing(member);
    setFormOpen(true);
  };

  const handleToggle = async (member: StaffMember) => {
    try {
      await toggleStatus.mutateAsync({ member });

      toast.success(
        member.isActive ? 'حساب کارمند غیرفعال شد' : 'حساب کارمند فعال شد',
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleChangeRole = async (member: StaffMember, role: StaffRole) => {
    if (member.role === role) return;

    try {
      await changeRole.mutateAsync({ id: member.id, role });

      toast.success(`نقش به «${STAFF_ROLE_LABELS[role]}» تغییر کرد`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await removeStaff.mutateAsync(deleteTarget.id);

      toast.success('کارمند حذف شد');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  // ستون‌ها در هر render ساخته می‌شوند چون سلول اکشن‌ها به handlerها نیاز دارد؛
  // جدول برای تعداد کم پرسنل به‌ینه‌سازی اضافی نمی‌خواهد
  const columns: Column<StaffMember>[] = [
    {
      key: 'fullName',
        header: 'نام',
        cell: (member) => (
          <span className="font-medium">{member.fullName || '—'}</span>
        ),
      },
      {
        key: 'mobile',
        header: 'موبایل',
        cell: (member) => (
          <span dir="ltr" className="tabular-nums">
            {toFa(displayMobile(member.mobile))}
          </span>
        ),
      },
      {
        key: 'email',
        header: 'ایمیل',
        cell: (member) =>
          member.email ? (
            <span dir="ltr" className="text-muted-foreground">
              {member.email}
            </span>
          ) : (
            '—'
          ),
      },
      {
        key: 'role',
        header: 'نقش',
        cell: (member) => (
          <StatusBadge
            label={STAFF_ROLE_LABELS[member.role]}
            tone={STAFF_ROLE_TONE[member.role]}
          />
        ),
      },
      {
        key: 'isActive',
        header: 'وضعیت',
        cell: (member) => (
          <StatusBadge
            label={member.isActive ? 'فعال' : 'غیرفعال'}
            tone={member.isActive ? 'success' : 'neutral'}
          />
        ),
      },
      {
        key: 'createdAt',
        header: 'تاریخ ثبت',
        cell: (member) => (
          <span className="tabular-nums">{formatJalali(member.createdAt)}</span>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'text-left',
        cell: (member) => (
          <StaffRowActions
            member={member}
            isSelf={user?.id === member.id}
            onEdit={() => handleEdit(member)}
            onToggle={() => handleToggle(member)}
            onChangeRole={(role) => handleChangeRole(member, role)}
            onDelete={() => setDeleteTarget(member)}
          />
        ),
      },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="پرسنل"
        description="مدیریت کارکنان و سطح دسترسی آن‌ها"
        actions={
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            افزودن کارمند
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجوی نام، موبایل یا ایمیل…"
            className="pr-9"
            aria-label="جستجو"
          />
        </div>

        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value as StaffRole | 'all')}
        >
          <SelectTrigger className="w-full lg:w-44" aria-label="فیلتر نقش">
            <SelectValue placeholder="همه نقش‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه نقش‌ها</SelectItem>
            {STAFF_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {STAFF_ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="w-full lg:w-40" aria-label="فیلتر وضعیت">
            <SelectValue placeholder="همه وضعیت‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="active">فعال</SelectItem>
            <SelectItem value="inactive">غیرفعال</SelectItem>
          </SelectContent>
        </Select>

        {hasFilter ? (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setRoleFilter('all');
              setStatusFilter('all');
            }}
          >
            پاک کردن فیلترها
          </Button>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">
        {toFa(filtered.length)} نفر از {toFa(allStaff.length)} کارمند
      </p>

      <DataTable<StaffMember>
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        rowKey={(member) => member.id}
        emptyTitle="پرسنلی وجود ندارد"
        emptyDescription="با دکمهٔ «افزودن کارمند» اولین کارمند را اضافه کنید."
      />

      <StaffFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        member={editing}
        currentUserId={user?.id}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف کارمند"
        description={
          deleteTarget
            ? `حساب «${deleteTarget.fullName}» غیرفعال و بایگانی می‌شود. این کار قابل بازگشت نیست.`
            : ''
        }
        confirmLabel="حذف"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

type StaffRowActionsProps = {
  member: StaffMember;
  /** این ردیف مربوط به حساب خود کاربر است */
  isSelf: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onChangeRole: (role: StaffRole) => void;
  onDelete: () => void;
};

/**
 * منوی عملیات هر ردیف — ویرایش، تغییر نقش، فعال/غیرفعال و حذف.
 *
 * عملیات روی حساب خودمان غیرفعال است تا کاربر نتواند خود را حذف یا
 * غیرفعال کند یا نقش خود را تغییر دهد.
 */
function StaffRowActions({
  member,
  isSelf,
  onEdit,
  onToggle,
  onChangeRole,
  onDelete,
}: StaffRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">عملیات</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>عملیات</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil className="h-4 w-4" />
          ویرایش
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ShieldCheck className="h-4 w-4" />
            تغییر نقش
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {STAFF_ROLES.map((role) => (
              <DropdownMenuCheckboxItem
                key={role}
                checked={member.role === role}
                disabled={member.role === role || isSelf}
                onSelect={() => onChangeRole(role)}
              >
                {STAFF_ROLE_LABELS[role]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem onSelect={onToggle} disabled={isSelf}>
          <Power className="h-4 w-4" />
          {member.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={onDelete}
          disabled={isSelf}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
          حذف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
