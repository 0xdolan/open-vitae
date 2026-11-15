import { useEffect, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';

import { pageBoxMm } from '@/lib/page-geometry';
import type { PageSlice } from '@/lib/pagination';
import type { ResumeDocument } from '@/schema/resume';

import { PageSheet } from './PageSheet';

interface PrintLayerProps {
  readonly doc: ResumeDocument;
  readonly pages: readonly PageSlice[] | null;
}

/**
 * What the browser prints. Only filled in while printing, so the pages are
 * not kept in the page twice. Works for the Print button and for Ctrl+P.
 * The print stylesheet hides the app and shows only this layer; @page sets
 * the paper size so "Save as PDF" produces exactly these pages.
 */
export function PrintLayer({ doc, pages }: PrintLayerProps) {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const start = () => flushSync(() => setPrinting(true));
    const stop = () => setPrinting(false);
    // Some browsers fire only the media query change, others only the events.
    const media = window.matchMedia('print');
    const onMedia = (event: MediaQueryListEvent) => (event.matches ? start() : stop());
    window.addEventListener('beforeprint', start);
    window.addEventListener('afterprint', stop);
    media.addEventListener('change', onMedia);
    return () => {
      window.removeEventListener('beforeprint', start);
      window.removeEventListener('afterprint', stop);
      media.removeEventListener('change', onMedia);
    };
  }, []);

  const { widthMm, heightMm } = pageBoxMm(doc.layout);
  const list = pages ?? [];

  return createPortal(
    <div className="ov-print-layer">
      {printing ? (
        <>
          <style>{`@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }`}</style>
          {list.map((slice, index) => (
            <PageSheet
              key={index}
              doc={doc}
              slice={slice}
              number={index + 1}
              total={list.length}
              className="ov-print-page"
            />
          ))}
        </>
      ) : null}
    </div>,
    document.body,
  );
}
