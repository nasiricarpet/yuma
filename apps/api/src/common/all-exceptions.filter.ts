import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { faMessages } from './messages.fa';

/**
 * فیلتر سراسری خطا — همه پاسخ‌های خطا فارسی و ساختاریافته
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = faMessages.common.internal;
    let errors: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        message = typeof b.message === 'string' ? b.message : (b.message as string[])?.[0] ?? message;
        if (Array.isArray(b.message)) errors = b.message;
        // خطاهای اعتبارسنجی فارسی که به‌صورت errors فرستاده می‌شوند
        if (Array.isArray(b.errors)) errors = b.errors;
      }
      if (status === HttpStatus.NOT_FOUND) message = faMessages.common.notFound;
      if (status === HttpStatus.UNAUTHORIZED) message = faMessages.common.unauthorized;
      if (status === HttpStatus.FORBIDDEN) message = faMessages.common.forbidden;
    } else {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      ok: false,
      message,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
