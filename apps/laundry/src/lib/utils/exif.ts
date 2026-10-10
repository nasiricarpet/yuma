/**
 * حذف متادیتای EXIF از تصاویر قبل از آپلود.
 *
 * اطلاعات مکانی و دستگاه ممکن است حریم خصوصی مشتری را نشانه‌گیری کند؛
 * تصویر دوباره روی canvas کدگذاری می‌شود تا متادیتا همراهش نماند.
 * اگر مرورگر امکان این کار را نداشت، فایل اصلی دست‌نخورده برمی‌گردد.
 */
export async function stripExif(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  // فرمت‌هایی که canvas نمی‌تواند بدون تلفات کدگذاری کند
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const quality = outputType === 'image/jpeg' ? 0.92 : undefined;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, quality),
    );

    if (!blob) return file;

    const baseName = file.name.replace(/\.[^./]+$/, '');
    const extension = outputType === 'image/png' ? '.png' : '.jpg';

    return new File([blob], `${baseName}${extension}`, {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch {
    // اگر تصویر قابل دیکد نبود (مثلاً HEIC روی مرورگرهای قدیمی)، فایل اصلی
    return file;
  }
}

/** حذف EXIF از چندین فایل به‌صورت موازی */
export async function stripExifFromFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map((file) => stripExif(file)));
}
