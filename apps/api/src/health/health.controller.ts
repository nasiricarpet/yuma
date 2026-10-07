import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { APP_LOCALE, APP_TIMEZONE } from '@yuma/config';
import { formatJalaliDate, toJalali } from '@yuma/persian';

@ApiTags('سلامت')
@Public()
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'وضعیت سلامت سرویس با تاریخ شمسی' })
  check() {
    const now = new Date();
    const jalali = toJalali(now);

    return {
      ok: true,
      status: 'سالم',
      locale: APP_LOCALE,
      timezone: APP_TIMEZONE,
      gregorian: now.toISOString(),
      jalali: {
        year: jalali.jy,
        month: jalali.jm,
        day: jalali.jd,
        formatted: formatJalaliDate(now, 'dddd D MMMM YYYY'),
        iso: `${jalali.jy}/${String(jalali.jm).padStart(2, '0')}/${String(jalali.jd).padStart(2, '0')}`,
      },
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}
