import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { TICKET_STATUSES, type TicketStatus } from './list-tickets.dto';

/**
 * بدنه‌ی تغییر وضعیت تیکت — مسیر PATCH /admin/support/tickets/:id/status
 *
 * گذار مجاز: open → pending_agent → resolved → closed.
 * مشتری می‌تواند با ثبت امتیاز رضایت، تیکت حل‌شده را ببندد.
 */
export class UpdateTicketStatusDto {
  /** وضعیت جدید */
  @IsEnum(TICKET_STATUSES, { message: 'وضعیت نامعتبر است' })
  status!: TicketStatus;

  /** امتیاز رضایت مشتری — ۱ تا ۵، فقط هنگام بستن تیکت توسط مشتری */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'امتیاز باید عدد باشد' })
  @Min(1, { message: 'حداقل امتیاز ۱ است' })
  @Max(5, { message: 'حداکثر امتیاز ۵ است' })
  satisfaction?: number;
}
