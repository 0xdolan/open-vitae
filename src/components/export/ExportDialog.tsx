import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { PageSheet } from '@/components/pages/PageSheet';
import { Button } from '@/components/ui/button';
import { CloseIcon, DownloadIcon } from '@/components/ui/icons';
import { downloadFile } from '@/lib/download';
import { DEFAULT_DPI, DPI_OPTIONS, PICTURE_FORMATS, type ExportFormat } from '@/config/export';
import type { ExportOptions } from '@/lib/export/run-export';
import type { PageSlice } from '@/lib/pagination';
import { cn } from '@/lib/utils';
import type { ResumeDocument } from '@/schema/resume';
import { fontRegistrar, toast, useResumeStore } from '@/stores';

interface FormatInfo {
  readonly id: ExportFormat;
  readonly label: string;
  readonly extension: string;
  readonly description: string;
}

const GROUPS: readonly { readonly title: string; readonly formats: readonly FormatInfo[] }[] = [
  {
    title: 'Documents',
    formats: [
      { id: 'pdf', label: 'PDF', extension: '.pdf', description: 'Looks exactly like the preview, with clickable links. Best for sending.' },
      { id: 'docx', label: 'Word', extension: '.docx', description: 'An editable document for Microsoft Word, LibreOffice or Google Docs.' },
      { id: 'icml', label: 'InDesign', extension: '.icml', description: 'A styled text story to place in an Adobe InDesign layout.' },
    ],
  },
  {
    title: 'Images',
    formats: [
      { id: 'png', label: 'PNG', extension: '.png', description: 'Sharp picture of each page, with no quality loss.' },
      { id: 'jpg', label: 'JPG', extension: '.jpg', description: 'Smaller picture of each page, for sharing online.' },
      { id: 'svg', label: 'SVG', extension: '.svg', description: 'Scalable picture of each page, for the web.' },
    ],
  },
  {
    title: 'Data (can be imported again)',
    formats: [
      { id: 'json', label: 'JSON', extension: '.json', description: 'A complete backup with every setting and the photo.' },
      { id: 'xlsx', label: 'Excel', extension: '.xlsx', description: 'One row per entry, to edit in a spreadsheet.' },
      { id: 'csv', label: 'CSV', extension: '.csv', description: 'The same table as plain text, for any app.' },
      { id: 'markdown', label: 'Markdown', extension: '.md', description: 'Plain text with headings and lists.' },
    ],
  },
];

const ALL_FORMATS = GROUPS.flatMap((g) => g.formats);

interface ExportDialogProps {
  readonly open: boolean;
  readonly pages: readonly PageSlice[] | null;
  readonly onClose: () => void;
}

/**
 * Export the open resume to any format. Pages for picture formats are drawn
 * from a copy of the pages laid out off screen at 100% zoom; nothing is
 * uploaded. Every export ends with the animated success message.
 */
export function ExportDialog({ open, pages, onClose }: ExportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const prepareExport = useResumeStore((s) => s.prepareExport);
  const markExported = useResumeStore((s) => s.markExported);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [dpi, setDpi] = useState<number>(DEFAULT_DPI);
  const [jpegQuality, setJpegQuality] = useState(0.9);
  const [pageChoice, setPageChoice] = useState<'all' | number>('all');
  const [job, setJob] = useState<{ options: ExportOptions; doc: ResumeDocument; version: Awaited<ReturnType<typeof prepareExport>> } | null>(null);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const pageCount = pages?.length ?? 0;
  const info = ALL_FORMATS.find((f) => f.id === format) as FormatInfo;
  const isPicture = PICTURE_FORMATS.includes(format);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (open) setError(null);
  }, [open]);

  useEffect(() => {
    if (typeof pageChoice === 'number' && pageChoice > pageCount) setPageChoice('all');
  }, [pageChoice, pageCount]);

  // Once the off-screen pages are on the page, draw and build the file.
  useEffect(() => {
    if (!job) return;
    let cancelled = false;
    const run = async () => {
      // Two frames: React has committed the stage and the browser has laid it out.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const pageElements = Array.from(stageRef.current?.querySelectorAll<HTMLElement>('.ov-page') ?? []);
      const prepared = job.version;
      // The exporters (and their libraries) load only when someone exports.
      const { runExport } = await import('@/lib/export/run-export');
      const file = await runExport({
        doc: job.doc,
        version: prepared?.version ?? null,
        appVersion: __APP_VERSION__,
        now: new Date(),
        pageElements,
        fontSources: fontRegistrar.sources(),
        options: job.options,
        onProgress: (message) => !cancelled && setProgress(message),
      });
      if (cancelled) return;
      downloadFile(file.fileName, file.blob, file.blob.type);
      if (prepared?.version) await markExported(prepared.version.id);
      const extra = file.warnings.length > 0 ? ` ${file.warnings.join(' ')}` : '';
      toast.success('Export complete', `${file.fileName} is in your downloads.${extra}`);
      onClose();
    };
    run()
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'The export failed.');
      })
      .finally(() => {
        if (!cancelled) {
          setJob(null);
          setProgress('');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [job, markExported, onClose]);

  const start = async () => {
    setError(null);
    setProgress('Saving…');
    const prepared = await prepareExport();
    if (!prepared) {
      setProgress('');
      setError('The resume could not be prepared for export.');
      return;
    }
    setJob({ options: { format, dpi, jpegQuality, pages: pageChoice }, doc: prepared.doc, version: prepared });
  };

  const busy = job !== null || progress !== '';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto w-[min(46rem,calc(100vw-1.5rem))] rounded-xl p-0 shadow-xl backdrop:bg-black/40"
    >
      {open ? (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-y-auto p-5">
          <div className="flex items-center gap-2">
            <h2 id={titleId} className="text-lg font-semibold">
              Export
            </h2>
            <Button variant="ghost" size="sm" className="ms-auto" aria-label="Close" disabled={busy} onClick={onClose}>
              <CloseIcon />
            </Button>
          </div>

          {GROUPS.map((group) => (
            <fieldset key={group.title} className="flex flex-col gap-2">
              <legend className="mb-1 text-xs font-semibold tracking-wide text-stone-500 uppercase">{group.title}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {group.formats.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      'flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand',
                      format === option.id ? 'border-brand bg-brand/5' : 'border-stone-200 hover:border-stone-300',
                    )}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <input
                        type="radio"
                        name={`${titleId}-format`}
                        className="accent-brand"
                        checked={format === option.id}
                        onChange={() => setFormat(option.id)}
                      />
                      {option.label}
                      <span className="text-xs font-normal text-stone-500">{option.extension}</span>
                    </span>
                    <span className="text-xs text-stone-600">{option.description}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          {isPicture ? (
            <div className="flex flex-wrap gap-4 rounded-lg bg-stone-50 p-3 text-sm">
              {format !== 'svg' ? (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-stone-700">Resolution</span>
                  <select className="h-9 rounded-md border border-stone-300 bg-white px-2" value={dpi} onChange={(e) => setDpi(Number(e.target.value))}>
                    {DPI_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value} DPI{value === 72 ? ' (screen)' : value === 150 ? ' (draft)' : value === 300 ? ' (print, default)' : ' (high-quality print)'}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {format === 'jpg' ? (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-stone-700">Quality: {Math.round(jpegQuality * 100)}%</span>
                  <input type="range" className="accent-brand" min={0.5} max={1} step={0.05} value={jpegQuality} onChange={(e) => setJpegQuality(Number(e.target.value))} />
                </label>
              ) : null}
              {format !== 'pdf' && pageCount > 1 ? (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-stone-700">Pages</span>
                  <select
                    className="h-9 rounded-md border border-stone-300 bg-white px-2"
                    value={String(pageChoice)}
                    onChange={(e) => setPageChoice(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  >
                    <option value="all">All {pageCount} pages (zip)</option>
                    {Array.from({ length: pageCount }, (_, i) => (
                      <option key={i} value={i + 1}>
                        Page {i + 1}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <span className="me-auto text-xs text-stone-500" aria-live="polite">
              {progress}
            </span>
            <Button disabled={busy} onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" disabled={busy || (isPicture && pageCount === 0)} onClick={() => void start()}>
              <DownloadIcon /> {busy ? 'Exporting…' : `Export ${info.label}`}
            </Button>
          </div>
        </div>
      ) : null}

      {job && pages
        ? createPortal(
            <div ref={stageRef} aria-hidden="true" className="pointer-events-none fixed top-0" style={{ left: -100_000 }}>
              {pages.map((slice, index) => (
                <PageSheet key={index} doc={job.doc} slice={slice} number={index + 1} total={pages.length} />
              ))}
            </div>,
            document.body,
          )
        : null}
    </dialog>
  );
}
