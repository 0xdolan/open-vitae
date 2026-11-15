import { effectiveDpi, pixelsForPrint, printQuality, PRINT_DPI } from '@/lib/photo';
import { cn } from '@/lib/utils';

const QUALITY = {
  good: { label: 'Sharp', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  fair: { label: 'Acceptable', className: 'bg-amber-50 text-amber-800 ring-amber-200' },
  low: { label: 'May look soft', className: 'bg-red-50 text-red-800 ring-red-200' },
} as const;

interface PhotoSizeGuideProps {
  /** Width of the finished photo in pixels. */
  readonly photoWidthPx: number;
  /** Width on the page in millimetres. */
  readonly widthMm: number;
}

/** How sharp the photo will print at its size on the page, and what it would need. */
export function PhotoSizeGuide({ photoWidthPx, widthMm }: PhotoSizeGuideProps) {
  const dpi = effectiveDpi(photoWidthPx, widthMm);
  const quality = QUALITY[printQuality(dpi)];
  const needed = pixelsForPrint(widthMm);
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600" role="status">
      <span className={cn('rounded-full px-2 py-0.5 font-medium ring-1', quality.className)}>{quality.label}</span>
      <span>
        {photoWidthPx} px wide at {widthMm} mm prints at about {dpi} DPI. For a crisp print at {PRINT_DPI} DPI it needs
        at least {needed} px.
      </span>
    </div>
  );
}
