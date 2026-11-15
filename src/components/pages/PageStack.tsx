import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { AlertIcon, ZoomInIcon, ZoomOutIcon } from '@/components/ui/icons';
import { getPageSize } from '@/config/page-sizes';
import { formatZoom, MAX_ZOOM, MIN_ZOOM, stepZoom, ZOOM_STEPS, type Zoom } from '@/config/preview';
import { pageWidthPx } from '@/lib/page-geometry';
import type { PageSlice } from '@/lib/pagination';
import { cn } from '@/lib/utils';
import type { ResumeDocument } from '@/schema/resume';

import { PageSheet } from './PageSheet';

interface PageStackProps {
  readonly doc: ResumeDocument;
  /** Null while the first measurement is running. */
  readonly pages: readonly PageSlice[] | null;
  readonly label: string;
  /** Largest zoom "fit" may choose. */
  readonly maxFitZoom?: number;
  /** Extra buttons at the end of the toolbar. */
  readonly actions?: ReactNode;
  readonly className?: string;
  readonly selectedSectionId?: string;
  readonly onSectionClick?: (id: string) => void;
}

function PageNote({
  slice,
  mode,
}: {
  readonly slice: PageSlice;
  readonly mode: 'smart' | 'manual';
}) {
  const notes: string[] = [];
  if (slice.tooTall) {
    notes.push(
      'Part of this page is cut off: one block is taller than a page. Shorten it, or use smaller text or margins.',
    );
  }
  if (slice.continued && mode === 'manual') {
    notes.push(
      'The previous page was full, so the content continued here. Add a page break where you want the page to end.',
    );
  }
  if (notes.length === 0) return null;
  return (
    <p className="flex max-w-prose items-start gap-1.5 text-start text-xs text-amber-800">
      <AlertIcon className="mt-0.5 shrink-0" />
      <span>{notes.join(' ')}</span>
    </p>
  );
}

/**
 * The pages of a resume, stacked, at true size and zoomed to fit or to a
 * chosen level, with a zoom toolbar and a note under any page that needs
 * attention.
 */
export function PageStack({
  doc,
  pages,
  label,
  maxFitZoom = 1,
  actions,
  className,
  selectedSectionId,
  onSectionClick,
}: PageStackProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const zoomId = useId();
  const [zoom, setZoom] = useState<Zoom>('fit');
  const [fitZoom, setFitZoom] = useState(1);
  const sheetWidth = pageWidthPx(doc.layout);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () =>
      setFitZoom(Math.max(MIN_ZOOM, Math.min(maxFitZoom, frame.clientWidth / sheetWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [sheetWidth, maxFitZoom]);

  const effective = zoom === 'fit' ? fitZoom : zoom;
  const total = pages?.length ?? 0;
  const size = getPageSize(doc.layout.pageSize);

  return (
    <div className={cn('flex min-h-0 flex-col gap-3', className)}>
      <div
        role="toolbar"
        aria-label={`${label} zoom`}
        className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600"
      >
        <Button
          variant="ghost"
          size="sm"
          aria-label="Zoom out"
          title="Zoom out"
          disabled={effective <= MIN_ZOOM}
          onClick={() => setZoom(stepZoom(effective, -1))}
        >
          <ZoomOutIcon />
        </Button>
        <label htmlFor={zoomId} className="sr-only">
          Zoom
        </label>
        <select
          id={zoomId}
          className="h-8 rounded-md border border-stone-300 bg-white px-1.5 text-xs"
          value={zoom === 'fit' ? 'fit' : String(zoom)}
          onChange={(e) => setZoom(e.target.value === 'fit' ? 'fit' : Number(e.target.value))}
        >
          <option value="fit">Fit width ({formatZoom(fitZoom)})</option>
          {ZOOM_STEPS.includes(effective as (typeof ZOOM_STEPS)[number]) ||
          zoom === 'fit' ? null : (
            <option value={String(effective)}>{formatZoom(effective)}</option>
          )}
          {ZOOM_STEPS.map((step) => (
            <option key={step} value={String(step)}>
              {formatZoom(step)}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Zoom in"
          title="Zoom in"
          disabled={effective >= MAX_ZOOM}
          onClick={() => setZoom(stepZoom(effective, 1))}
        >
          <ZoomInIcon />
        </Button>
        <span className="ms-1" aria-live="polite">
          {total === 1 ? '1 page' : `${total} pages`} · {size.label}{' '}
          {doc.layout.orientation === 'landscape' ? 'landscape' : ''}
          {doc.layout.pageBreaks === 'manual' ? ' · manual breaks' : ''}
        </span>
        {actions ? <span className="ms-auto flex items-center gap-1.5">{actions}</span> : null}
      </div>

      <div ref={frameRef} className="min-w-0 overflow-x-auto">
        <div
          role="region"
          aria-label={label}
          className="flex w-max min-w-full flex-col items-center gap-2"
          style={{ zoom: effective }}
        >
          {(pages ?? []).map((slice, index) => (
            <div key={index} className="flex flex-col items-center gap-1.5 pb-2">
              <PageSheet
                doc={doc}
                slice={slice}
                number={index + 1}
                total={total}
                className="shadow-lg ring-1 ring-black/10"
                selectedSectionId={selectedSectionId}
                onSectionClick={onSectionClick}
              />
              <div className="flex flex-col items-center gap-1" style={{ zoom: 1 / effective }}>
                <span className="text-xs text-stone-500">
                  Page {index + 1} of {total}
                </span>
                <PageNote slice={slice} mode={doc.layout.pageBreaks} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
