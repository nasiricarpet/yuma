'use client';

import * as React from 'react';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils/cn';

/** پراپ‌های فیلد متنی متصل به react-hook-form */
export interface TextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  /** برچسب فارسی فیلد */
  label?: string;
  /** متن کمکی زیر فیلد */
  description?: string;
  /** متن جایگزین (placeholder) */
  placeholder?: string;
  /** افزودن `aria-required` و علامت اختیاری بودن */
  required?: boolean;
  className?: string;
}

/**
 * فیلد متنی متصل به فرم — Label + Input + پیام خطا
 *
 * @example
 * <TextField control={control} name="fullName" label="نام و نام خانوادگی" required />
 */
export function TextField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  placeholder,
  required,
  className,
  ...props
}: TextFieldProps<TFieldValues, TName>) {
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
          <FormControl>
            <Input
              {...field}
              value={field.value ?? ''}
              placeholder={placeholder}
              aria-required={required}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
