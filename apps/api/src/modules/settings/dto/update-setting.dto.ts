import { IsBoolean, IsDefined, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * بدنه‌ی بروزرسانی یک تنظیم — مسیر PUT /admin/settings/:key
 *
 * مقدار می‌تواند هر JSON معبری باشد (رشته، عدد، بولین، آبجکت یا آرایه).
 * کلید از مسیر خوانده می‌شود و در بدنه پذیرفته نیست.
 */
export class UpdateSettingDto {
  /** مقدار جدید تنظیم */
  @IsDefined({ message: 'مقدار تنظیم الزامی است' })
  value!: unknown;

  /** آیا این تنظیم برای کاربران عمومی قابل مشاهده باشد؟ (اختیاری) */
  @IsOptional()
  @IsBoolean({ message: 'isPublic باید true یا false باشد' })
  isPublic?: boolean;
}

