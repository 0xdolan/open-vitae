import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { AlertIcon, ZoomInIcon, ZoomOutIcon } from '@/components/ui/icons';
import { Select } from '@/components/ui/select';
import { getPageSize } from '@/config/page-sizes';
import { formatZoom, MAX_ZOOM, MIN_ZOOM, stepZoom, ZOOM_STEPS, type Zoom } from '@/config/preview';
import { pageWidthPx } from '@/lib/page-geometry';
import type { PageSlice } from '@/lib/pagination';
import { cn } from '@/lib/utils';
import type { ResumeDocument } from '@/schema/resume';
import { useT } from '@/i18n';

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
  const t = useT();
  const notes: string[] = [];
  if (slice.tooTall) notes.push(t('pages.tooTall'));
  if (slice.continued && mode === 'manual') notes.push(t('pages.continued'));
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
  const t = useT();
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
        aria-label={t('pages.zoomToolbar', { label })}
        className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600"
      >
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('pages.zoomOut')}
          title={t('pages.zoomOut')}
          disabled={effective <= MIN_ZOOM}
          onClick={() => setZoom(stepZoom(effective, -1))}
        >
          <ZoomOutIcon />
        </Button>
        <Select
          id={zoomId}
          size="sm"
          aria-label={t('pages.zoom')}
          className="w-auto"
          value={zoom === 'fit' ? 'fit' : String(zoom)}
          onValueChange={(value) => setZoom(value === 'fit' ? 'fit' : Number(value))}
          items={[
            { value: 'fit', label: t('pages.fit', { zoom: formatZoom(fitZoom) }) },
            ...(ZOOM_STEPS.includes(effective as (typeof ZOOM_STEPS)[number]) || zoom === 'fit'
              ? []
              : [{ value: String(effective), label: formatZoom(effective) }]),
            ...ZOOM_STEPS.map((step) => ({ value: String(step), label: formatZoom(step) })),
          ]}
        />
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('pages.zoomIn')}
          title={t('pages.zoomIn')}
          disabled={effective >= MAX_ZOOM}
          onClick={() => setZoom(stepZoom(effective, 1))}
        >
          <ZoomInIcon />
        </Button>
        <span className="ms-1" aria-live="polite">
          {t('pages.count', { count: total })} · {size.label}
          {doc.layout.orientation === 'landscape' ? ` ${t('pages.landscape')}` : ''}
          {doc.layout.pageBreaks === 'manual' ? ` · ${t('pages.manual')}` : ''}
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
                <span className="text-xs text-stone-600">
                  {t('pages.pageOf', { number: index + 1, total })}
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
