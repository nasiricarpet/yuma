'use client';

import { useCallback, useRef } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { stripExifFromFiles } from '@/lib/utils/exif';
import { toFa } from '@/lib/utils/format';

/**
 * آپلود تصاویر کنترل کیفیت با حذف EXIF.
 *
 * متادیتای عکس (موقعیت مکانی، مدل دستگاه) قبل از ارسال حذف می‌شود تا
 * حریم خصوصی مشتری حفظ شود. حداقل دو عکس برای ثبت نتیجه لازم است.
 */
export interface QcPhotoUploadProps {
  /** فایل‌های انتخاب‌شده به‌همراه پیش‌نمایش محلی */
  photos: QcPhoto[];
  onChange: (photos: QcPhoto[]) => void;
  uploading: boolean;
  error: string | null;
}

export interface QcPhoto {
  /** شناسه موقت محلی */
  id: string;
  file: File;
  /** آدرس پیش‌نموان محلی — بعد از بارگذاری با URL سرور جایگزین می‌شود */
  url: string;
  /** آیا EXIF این عکس حذف شده؟ */
  stripped: boolean;
}

const MIN_PHOTOS = 2;

export function QcPhotoUpload({
  photos,
  onChange,
  uploading,
  error,
}: QcPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = '';
      if (files.length === 0) return;

      // EXIF همه تصاویر به‌صورت موازی حذف می‌شود
      const stripped = await stripExifFromFiles(files);
      const added: QcPhoto[] = files.map((original, index) => {
        const result = stripped[index] ?? original;
        return {
          id: `${result.name}-${result.size}-${Date.now()}-${index}`,
          file: result,
          url: URL.createObjectURL(result),
          // اگر فایل دست‌نخورده برگشت، یعنی EXIF حذف نشده
          stripped: result !== original,
        };
      });

      onChange([...photos, ...added]);
    },
    [photos, onChange],
  );

  const removePhoto = useCallback(
    (photoId: string) => {
      const target = photos.find((photo) => photo.id === photoId);
      if (target) URL.revokeObjectURL(target.url);
      onChange(photos.filter((photo) => photo.id !== photoId));
    },
    [photos, onChange],
  );

  const remaining = Math.max(0, MIN_PHOTOS - photos.length);

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleSelect}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          افزودن عکس
        </Button>

        <span className="text-xs text-muted-foreground">
          حداقل {toFa(MIN_PHOTOS)} عکس لازم است —
          {photos.length >= MIN_PHOTOS
            ? ` ${toFa(photos.length)} عکس انتخاب شده ✓`
            : ` ${toFa(remaining)} عکس دیگر نیاز است`}
        </span>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              <img
                src={photo.url}
                alt={photo.file.name}
                className="h-full w-full object-cover"
              />

              {photo.stripped ? (
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  بدون EXIF
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="absolute left-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="حذف عکس"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
