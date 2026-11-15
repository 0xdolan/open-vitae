import { effectiveDpi, pixelsForPrint, printQuality, PRINT_DPI } from '@/lib/photo';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import type { MessageKey } from '@/i18n/messages/en';

const QUALITY = {
  good: { label: 'photo.sharp', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  fair: { label: 'photo.fair', className: 'bg-amber-50 text-amber-800 ring-amber-200' },
  low: { label: 'photo.soft', className: 'bg-red-50 text-red-800 ring-red-200' },
} as const satisfies Record<string, { label: MessageKey; className: string }>;

interface PhotoSizeGuideProps {
  /** Width of the finished photo in pixels. */
  readonly photoWidthPx: number;
  /** Width on the page in millimetres. */
  readonly widthMm: number;
}

/** How sharp the photo will print at its size on the page, and what it would need. */
export function PhotoSizeGuide({ photoWidthPx, widthMm }: PhotoSizeGuideProps) {
  const t = useT();
  const dpi = effectiveDpi(photoWidthPx, widthMm);
  const quality = QUALITY[printQuality(dpi)];
  const needed = pixelsForPrint(widthMm);
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600" role="status">
      <span className={cn('rounded-full px-2 py-0.5 font-medium ring-1', quality.className)}>
        {t(quality.label)}
      </span>
      <span>
        {t('photo.guide', { px: photoWidthPx, mm: widthMm, dpi, target: PRINT_DPI, needed })}
      </span>
    </div>
  );
}
