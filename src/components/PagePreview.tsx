import type { ReactNode } from 'react';

import type { TextDirection } from '@/config/fonts';
import { getPageDimensionsMm, type Orientation, type PageSizeId } from '@/config/page-sizes';
import { cn } from '@/lib/utils';

interface PagePreviewProps {
  readonly pageSize: PageSizeId;
  readonly orientation: Orientation;
  readonly direction: TextDirection;
  readonly className?: string;
  readonly children: ReactNode;
}

/** A sheet of paper drawn at the true aspect ratio of the chosen page size. */
export function PagePreview({
  pageSize,
  orientation,
  direction,
  className,
  children,
}: PagePreviewProps) {
  const { widthMm, heightMm } = getPageDimensionsMm(pageSize, orientation);

  return (
    <div
      dir={direction}
      aria-label={`Page preview, ${widthMm} by ${heightMm} millimetres`}
      role="region"
      className={cn(
        'mx-auto w-full max-w-xl overflow-hidden bg-white p-[6%] shadow-lg ring-1 ring-black/10',
        className,
      )}
      style={{ aspectRatio: `${widthMm} / ${heightMm}` }}
    >
      {children}
    </div>
  );
}
