import { SetMetadata } from '@nestjs/common';

/** کلید متادیتا برای مسیرهای عمومی */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * دکوراتور @Public — مسیر را از گارد احراز هویت مستثنی می‌کند
 *
 * @example
 * @Public()
 * @Get('health')
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
