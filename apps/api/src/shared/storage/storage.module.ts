import { Global, Module } from '@nestjs/common';
import { S3Service } from './s3.service';

/**
 * ماژول ذخیره‌سازی — سراسری (Global) تا S3Service در همه ماژول‌ها در دسترس باشد
 */
@Global()
@Module({
  providers: [S3Service],
  exports: [S3Service],
})
export class StorageModule {}
