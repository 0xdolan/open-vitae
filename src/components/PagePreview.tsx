import { useEffect, useRef, useState, type ReactNode } from 'react';

import {
  CSS_PX_PER_MM,
  getPageDimensionsMm,
  type Orientation,
  type PageSizeId,
} from '@/config/page-sizes';
import { cn } from '@/lib/utils';

interface PagePreviewProps {
  readonly pageSize: PageSizeId;
  readonly orientation: Orientation;
  readonly marginMm: number;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * A sheet of paper at its true size in millimetres, zoomed to fit the space
 * available. A faint line marks where each page ends; real pagination with
 * smart and manual breaks arrives in phase 6.
 */
export function PagePreview({ pageSize, orientation, marginMm, className, children }: PagePreviewProps) {
  const { widthMm, heightMm } = getPageDimensionsMm(pageSize, orientation);
  const frameRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const sheetWidthPx = widthMm * CSS_PX_PER_MM;
    const update = () => setZoom(Math.min(1, frame.clientWidth / sheetWidthPx));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [widthMm]);

  const pageEdge = `calc(${heightMm}mm - 1px)`;

  return (
    <div ref={frameRef} className={cn('w-full', className)}>
      <div
        role="region"
        aria-label={`Page preview, ${widthMm} by ${heightMm} millimetres`}
        className="mx-auto bg-white shadow-lg ring-1 ring-black/10"
        style={{
          zoom,
          width: `${widthMm}mm`,
          minHeight: `${heightMm}mm`,
          padding: `${marginMm}mm`,
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${pageEdge}, #cbd5e1 ${pageEdge}, #cbd5e1 ${heightMm}mm)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
