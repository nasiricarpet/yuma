import { IsIn, IsString } from 'class-validator';

/**
 * تغییر وضعیت وظیفه سفیر — وضعیت pending به صورت پیش‌فرض
 * هنگام ثبت در دیتابیس داده می‌شود و سفیر فقط می‌تواند
 * یکی از این سه وضعیت را ارسال کند.
 */
export class UpdateAssignmentStatusDto {
  /** وضعیت جدید وظیفه */
  @IsString()
  @IsIn(['accepted', 'done', 'failed'])
  status!: string;
}
