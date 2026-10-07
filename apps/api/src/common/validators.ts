import { Transform } from 'class-transformer';
import { ValidationOptions, registerDecorator } from 'class-validator';
import {
  nationalCodeSchema,
  persianNameSchema,
  postalCodeSchema,
} from '@yuma/validators';

/**
 * پل بین اسکیماهای Zod پکیج @yuma/validators و دکوراتورهای class-validator
 * نرمال‌سازی (تبدیل ارقام فارسی و...) در دکوراتورهای Normalize انجام می‌شود
 * و پیام خطای فارسی از defaultMessage دکوراتور خوانده می‌شود
 */

type ZodStringSchema = {
  safeParse: (value: unknown) => { success: boolean; data?: unknown };
};

/** نرمال‌سازی مقدار با اسکیمای Zod — در صورت نامعتبری مقدار اصلی دست‌نخورده برمی‌گردد */
function zodNormalize(schema: ZodStringSchema) {
  return ({ value }: { value: unknown }) => {
    const result = schema.safeParse(value);
    return result.success ? (result.data as string) : value;
  };
}

export function NormalizePersianName() {
  return Transform(zodNormalize(persianNameSchema));
}

export function NormalizeNationalCode() {
  return Transform(zodNormalize(nationalCodeSchema));
}

export function NormalizePostalCode() {
  return Transform(zodNormalize(postalCodeSchema));
}

export function IsPersianName(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPersianName',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && persianNameSchema.safeParse(value).success,
        defaultMessage: () => 'نام باید فقط شامل حروف فارسی باشد (۲ تا ۶۰ کاراکتر)',
      },
    });
  };
}

export function IsNationalCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNationalCode',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && nationalCodeSchema.safeParse(value).success,
        defaultMessage: () => 'کد ملی نامعتبر است',
      },
    });
  };
}

export function IsPostalCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPostalCode',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && postalCodeSchema.safeParse(value).success,
        defaultMessage: () => 'کد پستی باید ۱۰ رقم باشد',
      },
    });
  };
}
