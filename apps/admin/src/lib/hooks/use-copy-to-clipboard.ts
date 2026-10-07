'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * کپی کردن متن در کلیپ‌بورد با fallback مرورگرهای قدیمی.
 *
 * @example
 * const { copied, copy } = useCopyToClipboard();
 * <button onClick={() => copy('YM-12345')}>{copied ? 'کپی شد' : 'کپی'}</button>
 */
export function useCopyToClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback برای مرورگرهای بدون Clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), resetDelay);
    return () => clearTimeout(timer);
  }, [copied, resetDelay]);

  return { copied, copy };
}
