import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { APP_LOCALE, APP_NAME, APP_TIMEZONE } from '@yuma/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { persianValidationPipeOptions } from './common/persian-validation';

// منطقه زمانی رسمی پروژه — پیش از هر استفاده از Date تنظیم می‌شود
process.env.TZ = APP_TIMEZONE;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe(persianValidationPipeOptions));
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${APP_NAME} API`)
    .setDescription('مستندات API پروژه یوما — تمام پاسخ‌ها و خطاها فارسی هستند')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(
    `🚀 API یوما روی http://localhost:${port} بالا آمد — لوکال: ${APP_LOCALE} | منطقه زمانی: ${APP_TIMEZONE}`,
  );
}

void bootstrap();
