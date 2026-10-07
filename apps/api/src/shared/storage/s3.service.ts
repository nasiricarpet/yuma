import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

/**
 * سرویس ذخیره‌سازی ابری — آپلود فایل روی فضای S3-compatible (MinIO)
 *
 * تنظیمات از طریق متغیرهای محیطی خوانده می‌شود:
 * S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, S3_REGION
 *
 * MinIO نیازمند forcePathStyle است تا مسیرها به‌جای زیردامنه در URL بیایند
 */
@Injectable()
export class S3Service implements OnModuleDestroy {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.requireEnv('S3_ENDPOINT');
    this.bucket = this.requireEnv('S3_BUCKET');

    this.client = new S3Client({
      region: this.config.get<string>('S3_REGION') ?? 'us-east-1',
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.requireEnv('S3_ACCESS_KEY'),
        secretAccessKey: this.requireEnv('S3_SECRET_KEY'),
      },
    });
  }

  /**
   * آپلود یک فایل در پوشه مشخص و بازگرداندن مسیر نسبی (کل) فایل
   *
   * مسیر برگشتی در دیتابیس ذخیره می‌شود و با endpoint عمومی
   * ترکیب‌پذیر است: `${S3_ENDPOINT}/${S3_BUCKET}/${key}`
   */
  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    // کل یکتا: پوشه + UUID + پسوند فایل اصلی
    const key = `${folder}/${randomUUID()}${extname(file.originalname)}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return key;
  }

  /** خواندن متغیر محیطی الزامی — در صورت نبودن، بالا آمدن سرویس راگ می‌شود */
  private requireEnv(key: string): string {
    const value = this.config.get<string>(key);
    if (!value) throw new Error(`متغیر محیطی ${key} تنظیم نشده است`);

    return value;
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }
}
