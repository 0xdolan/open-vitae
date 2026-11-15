import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { ResumeRenderer } from '@/components/resume/ResumeRenderer';
import { CSS_PX_PER_MM } from '@/config/page-sizes';
import { contentBoxMm } from '@/lib/page-geometry';
import { describeBlocks, paginate, type MeasuredBlock, type PageSlice } from '@/lib/pagination';
import type { ResumeDocument } from '@/schema/resume';

interface FlowMeasureProps {
  readonly doc: ResumeDocument;
  readonly onPages: (pages: PageSlice[]) => void;
}

/**
 * Lays the whole resume out once, invisibly, at the page's content width,
 * measures every block and works out the pages. Measures again whenever the
 * content changes size: edits, fonts finishing loading, images decoding.
 */
export function FlowMeasure({ doc, onPages }: FlowMeasureProps) {
  const ref = useRef<HTMLDivElement>(null);
  const docRef = useRef(doc);
  docRef.current = doc;
  const lastResult = useRef('');
  const onPagesRef = useRef(onPages);
  onPagesRef.current = onPages;

  const { widthMm, heightMm } = contentBoxMm(doc.layout);
  const pageHeightPx = heightMm * CSS_PX_PER_MM;
  const mode = doc.layout.pageBreaks;

  const measure = useCallback(() => {
    const root = ref.current;
    if (!root) return;
    const rootRect = root.getBoundingClientRect();
    // Guard against an ancestor being zoomed or scaled.
    const scale = root.offsetHeight > 0 ? rootRect.height / root.offsetHeight : 1;
    const measured: MeasuredBlock[] = Array.from(root.querySelectorAll<HTMLElement>('[data-ov-b]')).map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        key: node.dataset.ovB ?? '',
        top: (rect.top - rootRect.top) / scale,
        bottom: (rect.bottom - rootRect.top) / scale,
      };
    });
    const pages = paginate(describeBlocks(docRef.current, measured), { pageHeight: pageHeightPx, mode });
    const signature = JSON.stringify(pages);
    if (signature !== lastResult.current) {
      lastResult.current = signature;
      onPagesRef.current(pages);
    }
  }, [pageHeightPx, mode]);

  // Before paint, so the preview never flashes an unpaginated page.
  useLayoutEffect(() => {
    measure();
  }, [doc, measure]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    document.fonts.addEventListener('loadingdone', schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', schedule);
    };
  }, [measure]);

  return (
    <div className="pointer-events-none fixed top-0 start-0 h-0 w-0 overflow-hidden" aria-hidden="true">
      <div
        ref={ref}
        inert
        className="pointer-events-none invisible absolute top-0 start-0"
        style={{ width: `${widthMm}mm` }}
      >
        <ResumeRenderer doc={doc} />
      </div>
    </div>
  );
}
