import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SupportService } from './support.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';

/**
 * تبدیل BigInt به رشته —
 * `SupportMessage.id` در دیتابیس BigInt است و `JSON.stringify`
 * نمی‌تواند BigInt را سریال کند، پس در لایه‌ی انتقال به رشته تبدیل می‌شود.
 * کلاینت آن را با `Number()` می‌خواند.
 */
function serializeMessageId<T extends { id: bigint }>(
  message: T,
): Omit<T, 'id'> & { id: string } {
  return { ...message, id: message.id.toString() };
}

/**
 * کنترلر تیکت‌های پشتیبانی — سمت پشتیبان (پنل ادمین)
 *
 * مسیرها:
 *  GET    /support/tickets                  لیست همه‌ی تیکت‌ها با فیلتر
 *  GET    /support/tickets/:id              جزئیات تیکت + همه‌ی پیام‌ها
 *  PATCH  /support/tickets/:id/assign       تخصیص تیکت به کارشناس
 *  PATCH  /support/tickets/:id/status       تغییر وضعیت تیکت
 *  POST   /support/tickets/:id/messages     ثبت پاسخ پشتیبان (عمومی یا داخلی)
 *
 * برخلاف نمای مشتری، پیام‌های داخلی و فیلتر `unassigned`/`slaBreached`
 * در این مسیرها در دسترس هستند.
 *
 * گارد JWT و RolesGuard به صورت سراسری در AuthModule ثبت شده‌اند.
 */
@ApiTags('پشتیبانی')
@Controller('support/tickets')
@Roles('admin', 'manager', 'support', 'expert')
export class AdminSupportController {
  constructor(private readonly support: SupportService) {}

  /** لیست تیکت‌ها — اولویت‌دارها بالاتر، سپس جدیدترین‌ها */
  @Get()
  @ApiOperation({ summary: 'لیست تیکت‌های پشتیبانی (پنل)' })
  async list(@Query() query: ListTicketsDto) {
    const result = await this.support.listAgentTickets(query);

    return { ok: true, ...result };
  }

  /** جزئیات تیکت — شامل پیام‌های داخلی پشتیبان */
  @Get(':id')
  @ApiOperation({ summary: 'جزئیات تیکت پشتیبانی (پنل)' })
  async getOne(@Param('id') ticketId: string) {
    const ticket = await this.support.getAgentTicket(ticketId);

    return {
      ok: true,
      ticket: {
        ...ticket,
        messages: ticket.messages.map(serializeMessageId),
      },
    };
  }

  /**
   * تخصیص تیکت به کارشناس پشتیبانی
   *
   * کاربر مشخص‌شده باید یکی از نقش‌های پشتیبانی داشته باشد و فعال باشد.
   */
  @Patch(':id/assign')
  @ApiOperation({ summary: 'تخصیص تیکت به کارشناس پشتیبانی' })
  async assign(
    @Param('id') ticketId: string,
    @Body() dto: AssignTicketDto,
    @CurrentUser('id') actorId: string,
  ) {
    const ticket = await this.support.assignTicket(
      ticketId,
      dto.assignedToId,
      actorId,
    );

    return {
      ok: true,
      ticket: {
        ...ticket,
        messages: ticket.messages.map(serializeMessageId),
      },
    };
  }

  /**
   * تغییر وضعیت تیکت
   *
   * گذار مجاز: open → pending_agent → resolved → closed.
   * `resolved` زمان حل و `closed` زمان بسته‌شدن را ثبت می‌کند.
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'تغییر وضعیت تیکت پشتیبانی' })
  async updateStatus(
    @Param('id') ticketId: string,
    @Body() dto: UpdateTicketStatusDto,
    @CurrentUser('id') actorId: string,
  ) {
    const ticket = await this.support.updateStatus(
      ticketId,
      dto.status,
      actorId,
      dto.satisfaction,
    );

    return {
      ok: true,
      ticket: {
        ...ticket,
        messages: ticket.messages.map(serializeMessageId),
      },
    };
  }

  /**
   * ثبت پاسخ پشتیبان
   *
   * اولین پاسخ، `firstResponseAt` را پر می‌کند (معیار رعایت SLA).
   * `visibility: internal` یادداشت خصوصی است که مشتری آن را نمی‌بیند.
   */
  @Post(':id/messages')
  @ApiOperation({ summary: 'ثبت پاسخ پشتیبان در تیکت' })
  async addMessage(
    @Param('id') ticketId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser('id') agentId: string,
  ) {
    const message = await this.support.addAgentMessage(
      agentId,
      ticketId,
      dto.body,
      dto.visibility ?? 'public',
    );

    return { ok: true, message: serializeMessageId(message) };
  }
}
