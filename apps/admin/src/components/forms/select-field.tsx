'use client';

import * as React from 'react';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils/cn';

/** یک گزینه از	select */
export interface SelectOption {
  /** مقدار ماشینی */
  value: string;
  /** برچسب فارسی نمایشی */
  label: string;
  /** غیرفعال کردن این گزینه */
  disabled?: boolean;
}

export interface SelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  label?: string;
  description?: string;
  /** متن جایگزین وقتی چیزی انتخاب نشده */
  placeholder?: string;
  required?: boolean;
  /** گزینه‌های انتخاب */
  options: SelectOption[];
  className?: string;
}

/**
 * فیلد انتخاب متصل به فرم — DropDown راست‌به‌چپ Radix
 *
 * @example
 * <SelectField
 *   control={control}
 *   name="status"
 *   label="وضعیت"
 *   placeholder="انتخاب کنید"
 *   options={ORDER_STATUS_OPTIONS}
 * />
 */
export function SelectField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  placeholder,
  required,
  options,
  className,
  ...props
}: SelectFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      {...props}
      render={({ field }) => (
        <FormItem className={cn(className)}>
          {label ? (
            <FormLabel>
              {label}
              {required ? <span className="text-destructive"> *</span> : null}
            </FormLabel>
          ) : null}
          <Select
            value={String(field.value ?? '')}
            onValueChange={field.onChange}
            disabled={props.disabled}
          >
            <FormControl>
              <SelectTrigger aria-required={required}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
