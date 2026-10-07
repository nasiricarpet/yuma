'use client';

import * as React from 'react';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils/cn';

export interface TextAreaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  /** تعداد ردیف‌ها */
  rows?: number;
  className?: string;
}

/**
 * فیلد متن چندخطی متصل به فرم — مناسب توضیحات و یادداشت
 *
 * @example
 * <TextAreaField control={control} name="address" label="آدرس" rows={3} />
 */
export function TextAreaField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  placeholder,
  required,
  rows,
  className,
  ...props
}: TextAreaFieldProps<TFieldValues, TName>) {
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
            <Textarea
              {...field}
              value={field.value ?? ''}
              placeholder={placeholder}
              rows={rows}
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
