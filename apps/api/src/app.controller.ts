import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import {
  APP_DIR,
  APP_LOCALE,
  APP_NAME,
  APP_NAME_EN,
  APP_TIMEZONE,
  CURRENCY,
} from '@yuma/config';

@ApiTags('ریشه')
@Public()
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'اطلاعات پایه سرویس' })
  root() {
    return {
      ok: true,
      app: APP_NAME,
      appEn: APP_NAME_EN,
      version: '0.1.0',
      locale: APP_LOCALE,
      dir: APP_DIR,
      timezone: APP_TIMEZONE,
      currency: CURRENCY,
      docs: '/docs',
    };
  }

  @Get('ping')
  @ApiOperation({ summary: 'بررسی سریع در دسترس بودن سرویس' })
  ping() {
    return { ok: true, message: 'پینگ موفق بود' };
  }
}
