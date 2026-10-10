import { IsNotEmpty, IsString } from 'class-validator';

/**
 * بدنه‌ی تخصیص تیکت به پشتیبان — مسیر PATCH /admin/support/tickets/:id/assign
 *
 * شناسه‌ی پشتیبان باید یکی از کاربران دارای نقش پشتیبانی باشد.
 * مقدار خالی یعنی لغو تخصیص.
 */
export class AssignTicketDto {
  /** شناسه‌ی کاربر پشتیبان — برای لغو تخصیص خالی ارسال کنید */
  @IsString({ message: 'شناسه پشتیبان باید متن باشد' })
  @IsNotEmpty({ message: 'شناسه پشتیبان الزامی است' })
  assignedToId!: string;
}
