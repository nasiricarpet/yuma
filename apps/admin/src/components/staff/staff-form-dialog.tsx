'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { persianNameSchema, mobileSchema } from '@yuma/validators';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SelectField, TextField } from '@/components/forms';
import {
  STAFF_ROLES,
  STAFF_ROLE_LABELS,
  type StaffFormValues,
  type StaffMember,
  type StaffRole,
} from '@/types';
import { useCreateStaff, useUpdateStaff } from '@/lib/api/queries/use-staff';
import { getApiErrorMessage } from '@/lib/utils/errors';

/** نقش‌های مجاز در فرم — به‌صورت تاپل برای zodEnum */
const ROLE_VALUES = STAFF_ROLES as unknown as [StaffRole, ...StaffRole[]];

/**
 * اسکیمای فرم پرسنل
 *
 * موبایل و نام با همان اعتبارسنجی بک‌اند (mobileSchema و persianNameSchema
 * از @yuma/validators) بررسی می‌شوند تا خطاها فارسی و یکسان باشند.
 * رمز عبور اختیاری است — خالی می‌ماند و ورود از طریق OTP انجام می‌شود.
 */
const staffSchema = z.object({
  fullName: persianNameSchema,
  mobile: mobileSchema,
  email: z
    .string()
    .trim()
    .email('ایمیل نامعتبر است')
    .optional()
    .or(z.literal('')),
  role: z.enum(ROLE_VALUES, { error: 'نقش را انتخاب کنید' }),
  password: z
    .string()
    .optional()
    .refine((value) => !value || value.length >= 8, {
      message: 'رمز عبور باید حداقل ۸ کاراکتر باشد',
    }),
});

export type StaffFormDialogProps = {
  /** باز بودن مودال */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** کارمند در حال ویرایش — null یعنی حالت ساخت */
  member?: StaffMember | null;
  /** شناسه کاربر فعلی — برای غیرفعال کردن تغییر نقش حساب خودمان */
  currentUserId?: string;
};

/**
 * مودال ساخت و ویرایش کارمند
 *
 * در حالت ویرایش موبایل قابل تغییر نیست (بک‌اند آن را در UpdateUserDto
 * نمی‌پذیرد) و رمز عبور فقط در صورت پر شدن عوض می‌شود.
 */
export function StaffFormDialog({
  open,
  onOpenChange,
  member,
  currentUserId,
}: StaffFormDialogProps) {
  const isEdit = Boolean(member);
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const isSubmitting = createStaff.isPending || updateStaff.isPending;

  // جلوگیری از تغییر نقش حساب خودمان — بک‌اند هم این کار را رد می‌کند
  const isSelf = Boolean(member && currentUserId === member.id);

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      fullName: '',
      mobile: '',
      email: '',
      role: 'expert',
      password: '',
    },
  });

  // باز شدن مودال → پر کردن فرم با دادهٔ کارمند (در حالت ویرایش)
  useEffect(() => {
    if (!open) return;

    form.reset({
      fullName: member?.fullName ?? '',
      mobile: member?.mobile ?? '',
      email: member?.email ?? '',
      role: member?.role ?? 'expert',
      password: '',
    });
  }, [open, member, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const email = values.email.trim() || undefined;
    const password = values.password || undefined;

    try {
      if (isEdit && member) {
        await updateStaff.mutateAsync({
          id: member.id,
          data: {
            fullName: values.fullName,
            email,
            // نقش حساب خودمان را از این مسیر تغییر نمی‌دهیم
            role: isSelf ? member.role : values.role,
          },
        });

        toast.success('اطلاعات کارمند به‌روزرسانی شد');
      } else {
        await createStaff.mutateAsync({
          fullName: values.fullName,
          mobile: values.mobile,
          email,
          role: values.role,
          password,
        });

        toast.success('کارمند جدید اضافه شد');
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'ویرایش کارمند' : 'افزودن کارمند'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'تغییر اطلاعات این کارمند — موبایل قابل ویرایش نیست.'
              : 'کارمند جدید با یکی از نقش‌های عملیاتی سامانه.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              control={form.control}
              name="fullName"
              label="نام و نام خانوادگی"
              placeholder="مثال: یوما کرپیت"
              required
            />

            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    شماره موبایل
                    <span className="text-destructive"> *</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      dir="ltr"
                      inputMode="tel"
                      placeholder="09123456789"
                      disabled={isEdit}
                      aria-required
                    />
                  </FormControl>
                  {isEdit ? (
                    <FormDescription>موبایل قابل تغییر نیست</FormDescription>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            <TextField
              control={form.control}
              name="email"
              label="ایمیل"
              placeholder="example@yuma.ir"
              description="اختیاری"
            />

            <SelectField
              control={form.control}
              name="role"
              label="نقش"
              placeholder="انتخاب نقش"
              required
              disabled={isSelf}
              options={STAFF_ROLES.map((role) => ({
                value: role,
                label: STAFF_ROLE_LABELS[role],
              }))}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رمز عبور</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      type="password"
                      dir="ltr"
                      placeholder="حداقل ۸ کاراکتر"
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormDescription>
                    {isEdit
                      ? 'اختیاری — فقط در صورت تغییر رمز پر کنید.'
                      : 'اختیاری — بدون رمز، ورود از طریق کد یکتاست.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'در حال ذخیره…'
                  : isEdit
                    ? 'ذخیره تغییرات'
                    : 'افزودن کارمند'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
