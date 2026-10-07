import { BadRequestException, ValidationPipeOptions } from '@nestjs/common';
import { faMessages } from './messages.fa';

/**
 * ValidationPipe با پیام‌های فارسی
 */
export const persianValidationPipeOptions: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errors) => {
    const messages: string[] = [];
    for (const err of errors) {
      const constraints = err.constraints ?? {};
      for (const key of Object.keys(constraints)) {
        // پیام‌های پیش‌فرض class-validator را با معادل فارسی جایگزین می‌کنیم
        const fa = mapClassValidatorMessage(key, constraints[key]!, err.property);
        messages.push(fa);
      }
      for (const child of err.children ?? []) {
        for (const c of Object.values(child.constraints ?? {})) {
          messages.push(String(c));
        }
      }
    }
    return new BadRequestException({
      ok: false,
      message: faMessages.common.validation,
      errors: messages,
    });
  },
};

function mapClassValidatorMessage(rule: string, original: string, property: string): string {
  const fieldNames: Record<string, string> = {
    mobile: 'شماره موبایل',
    password: 'رمز عبور',
    fullName: 'نام و نام خانوادگی',
    nationalCode: 'کد ملی',
    postalCode: 'کد پستی',
    address: 'آدرس',
    city: 'شهر',
    province: 'استان',
    trackingCode: 'کد پیگیری',
    status: 'وضعیت',
    note: 'یادداشت',
  };
  const field = fieldNames[property] ?? property;

  const map: Record<string, string> = {
    isNotEmpty: `${field} الزامی است`,
    isString: `${field} باید متن باشد`,
    isNumber: `${field} باید عدد باشد`,
    isInt: `${field} باید عدد صحیح باشد`,
    isEnum: `${field} مقدار نامعتبری دارد`,
    isMobilePhone: `${field} نامعتبر است`,
    minLength: `${field} بسیار کوتاه است`,
    maxLength: `${field} بسیار بلند است`,
  };
  return map[rule] ?? original;
}
