import { useEffect, useId, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { CloseIcon, PrinterIcon } from '@/components/ui/icons';
import { getPageSize } from '@/config/page-sizes';
import type { PageSlice } from '@/lib/pagination';
import type { ResumeDocument } from '@/schema/resume';
import { useT } from '@/i18n';

import { PageStack } from './PageStack';

interface PrintPreviewProps {
  readonly open: boolean;
  readonly doc: ResumeDocument;
  readonly pages: readonly PageSlice[] | null;
  readonly onClose: () => void;
}

/**
 * Full-screen print preview: every page exactly as it will print, with zoom
 * and a button that opens the browser's print dialog (where "Save as PDF" is
 * also offered). Built on <dialog>, so focus is trapped and Escape closes it.
 */
export function PrintPreview({ open, doc, pages, onClose }: PrintPreviewProps) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const size = getPageSize(doc.layout.pageSize);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="text-foreground m-0 h-dvh max-h-none w-dvw max-w-none bg-stone-100 p-0 backdrop:bg-black/50"
    >
      {open ? (
        <div className="flex h-full flex-col">
          <header className="flex flex-wrap items-center gap-3 border-b border-stone-200 bg-card px-4 py-3">
            <h2 id={titleId} className="text-base font-semibold">
              {t('print.title')}
            </h2>
            <p className="text-xs text-stone-500">
              {t('print.help', {
                size: `${size.label}${doc.layout.orientation === 'landscape' ? ` ${t('pages.landscape')}` : ''}`,
              })}
            </p>
            <div className="ms-auto flex items-center gap-2">
              <Button variant="primary" onClick={() => window.print()} autoFocus>
                <PrinterIcon /> {t('print.print')}
              </Button>
              <Button
                variant="ghost"
                aria-label={t('print.close')}
                title={`${t('print.close')} (Esc)`}
                onClick={onClose}
              >
                <CloseIcon />
              </Button>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <PageStack
              doc={doc}
              pages={pages}
              label={t('print.pagesLabel')}
              maxFitZoom={1.25}
              className="mx-auto max-w-6xl"
            />
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
