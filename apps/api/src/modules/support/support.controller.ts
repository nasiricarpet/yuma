import {
  Body,
  Controller,
  Get,
  Param,
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
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateMessageDto } from './dto/create-message.dto';
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
 * کنترلر تیکت‌های پشتیبانی — سمت مشتری
 *
 * مسیرها:
 *  POST   /tickets                  ثبت تیکت جدید
 *  GET    /tickets                  لیست تیکت‌های مشتری (جدیدترین اول)
 *  GET    /tickets/:id              جزئیات تیکت + پیام‌های عمومی
 *  POST   /tickets/:id/messages     ثبت پیام در تیکت
 *
 * مشتری فقط تیکت‌های خودش را می‌بیند؛ شناسه‌ی مشتری از طریق
 * @CurrentUser() استخراج می‌شود و در کوئری‌ها اعمال می‌شود.
 * پیام‌های داخلی پشتیبان در این مسیرها فیلتر می‌شوند.
 *
 * گارد JWT و RolesGuard به صورت سراسری در AuthModule ثبت شده‌اند.
 */
@ApiTags('پشتیبانی')
@Controller('tickets')
@Roles('customer')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  /** ثبت تیکت جدید — اولین پیام تیکت هم در همان کوئری ذخیره می‌شود */
  @Post()
  @ApiOperation({ summary: 'ثبت تیکت پشتیبانی توسط مشتری' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTicketDto,
  ) {
    const ticket = await this.support.createTicket(user.id, dto);

    return {
      ok: true,
      ticket: {
        ...ticket,
        messages: ticket.messages.map(serializeMessageId),
      },
    };
  }

  /** لیست تیکت‌های مشتری — صفحه‌بندی‌شده، جدیدترین‌ها اول */
  @Get()
  @ApiOperation({ summary: 'لیست تیکت‌های مشتری لاگین‌شده' })
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListTicketsDto,
  ) {
    const result = await this.support.listCustomerTickets(user.id, query);

    return { ok: true, ...result };
  }

  /**
   * جزئیات تیکت — پیام‌های داخلی پشتیبان در پاسخ نیستند
   *
   * تیکت متعلق به مشتری دیگری یافت نمی‌شود تا شناسه‌ها فاش نشوند.
   */
  @Get(':id')
  @ApiOperation({ summary: 'جزئیات تیکت پشتیبانی + پیام‌های عمومی' })
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') ticketId: string,
  ) {
    const ticket = await this.support.getCustomerTicket(user.id, ticketId);

    return {
      ok: true,
      ticket: {
        ...ticket,
        messages: ticket.messages.map(serializeMessageId),
      },
    };
  }

  /** ثبت پیام در تیکت — تیکت حل‌شده با پیام جدید مجدداً باز می‌شود */
  @Post(':id/messages')
  @ApiOperation({ summary: 'ثبت پیام در تیکت پشتیبانی' })
  async addMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') ticketId: string,
    @Body() dto: CreateMessageDto,
  ) {
    // مشتری نمی‌تواند پیام داخلی ثبت کند — دیدمندی همیشه public است
    const message = await this.support.addCustomerMessage(
      user.id,
      ticketId,
      dto.body,
    );

    return { ok: true, message: serializeMessageId(message) };
  }
}
