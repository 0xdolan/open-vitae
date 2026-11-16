import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { PageSheet } from '@/components/pages/PageSheet';
import { Button } from '@/components/ui/button';
import { CloseIcon, DownloadIcon } from '@/components/ui/icons';
import { Select } from '@/components/ui/select';
import { downloadFile } from '@/lib/download';
import { DEFAULT_DPI, DPI_OPTIONS, PICTURE_FORMATS, type ExportFormat } from '@/config/export';
import type { ExportOptions } from '@/lib/export/run-export';
import type { PageSlice } from '@/lib/pagination';
import { cn } from '@/lib/utils';
import type { ResumeDocument } from '@/schema/resume';
import { fontRegistrar, toast, useResumeStore } from '@/stores';
import { useT, type MessageKey } from '@/i18n';
import { useBackdropDismiss } from '@/hooks/useDismiss';

interface FormatInfo {
  readonly id: ExportFormat;
  /** Format names (PDF, Word, …) are the same in every language. */
  readonly label: string;
  readonly extension: string;
  readonly description: MessageKey;
}

const GROUPS: readonly { readonly title: MessageKey; readonly formats: readonly FormatInfo[] }[] = [
  {
    title: 'export.groupDocuments',
    formats: [
      { id: 'pdf', label: 'PDF', extension: '.pdf', description: 'export.pdf' },
      { id: 'docx', label: 'Word', extension: '.docx', description: 'export.docx' },
      { id: 'icml', label: 'InDesign', extension: '.icml', description: 'export.icml' },
    ],
  },
  {
    title: 'export.groupImages',
    formats: [
      { id: 'png', label: 'PNG', extension: '.png', description: 'export.png' },
      { id: 'jpg', label: 'JPG', extension: '.jpg', description: 'export.jpg' },
      { id: 'svg', label: 'SVG', extension: '.svg', description: 'export.svg' },
    ],
  },
  {
    title: 'export.groupData',
    formats: [
      { id: 'json', label: 'JSON', extension: '.json', description: 'export.json' },
      { id: 'xlsx', label: 'Excel', extension: '.xlsx', description: 'export.xlsx' },
      { id: 'csv', label: 'CSV', extension: '.csv', description: 'export.csv' },
      { id: 'markdown', label: 'Markdown', extension: '.md', description: 'export.markdown' },
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
  const t = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdrop = useBackdropDismiss(() => {
    if (!busy) onClose();
  });
  const stageRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const prepareExport = useResumeStore((s) => s.prepareExport);
  const markExported = useResumeStore((s) => s.markExported);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [dpi, setDpi] = useState<number>(DEFAULT_DPI);
  const [jpegQuality, setJpegQuality] = useState(0.9);
  const [pageChoice, setPageChoice] = useState<'all' | number>('all');
  const [job, setJob] = useState<{
    options: ExportOptions;
    doc: ResumeDocument;
    version: Awaited<ReturnType<typeof prepareExport>>;
  } | null>(null);
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
      const pageElements = Array.from(
        stageRef.current?.querySelectorAll<HTMLElement>('.ov-page') ?? [],
      );
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
      toast.success(t('export.done'), `${t('export.doneBody', { file: file.fileName })}${extra}`);
      onClose();
    };
    run()
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('export.failed'));
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
  }, [job, markExported, onClose, t]);

  const start = async () => {
    setError(null);
    setProgress(t('export.saving'));
    const prepared = await prepareExport();
    if (!prepared) {
      setProgress('');
      setError(t('export.notReady'));
      return;
    }
    setJob({
      options: { format, dpi, jpegQuality, pages: pageChoice },
      doc: prepared.doc,
      version: prepared,
    });
  };

  const busy = job !== null || progress !== '';

  return (
    <dialog
      ref={dialogRef}
      {...backdrop}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto w-[min(46rem,calc(100vw-1.5rem))] bg-card text-foreground rounded-xl border border-stone-200 p-0 shadow-xl backdrop:bg-black/40"
    >
      {open ? (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-y-auto p-5">
          <div className="flex items-center gap-2">
            <h2 id={titleId} className="text-lg font-semibold">
              {t('export.title')}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="ms-auto"
              aria-label={t('export.close')}
              disabled={busy}
              onClick={onClose}
            >
              <CloseIcon />
            </Button>
          </div>

          {GROUPS.map((group) => (
            <fieldset key={group.title} className="flex flex-col gap-2">
              <legend className="mb-1 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                {t(group.title)}
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {group.formats.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      'flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand',
                      format === option.id
                        ? 'border-brand bg-brand/5'
                        : 'border-stone-200 hover:border-stone-300',
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
                      <span className="text-xs font-normal text-stone-600">{option.extension}</span>
                    </span>
                    <span className="text-xs text-stone-600">{t(option.description)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          {isPicture ? (
            <div className="flex flex-wrap gap-4 rounded-lg bg-stone-50 p-3 text-sm">
              {format !== 'svg' ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-stone-700">
                    {t('export.resolution')}
                  </span>
                  <Select
                    aria-label={t('export.resolution')}
                    value={String(dpi)}
                    onValueChange={(value) => setDpi(Number(value))}
                    items={DPI_OPTIONS.map((value) => ({
                      value: String(value),
                      label: t(
                        value === 72
                          ? 'export.dpiScreen'
                          : value === 150
                            ? 'export.dpiDraft'
                            : value === 300
                              ? 'export.dpiPrint'
                              : 'export.dpiHigh',
                        { dpi: value },
                      ),
                    }))}
                  />
                </div>
              ) : null}
              {format === 'jpg' ? (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-stone-700">
                    {t('export.quality', { percent: Math.round(jpegQuality * 100) })}
                  </span>
                  <input
                    type="range"
                    className="accent-brand"
                    min={0.5}
                    max={1}
                    step={0.05}
                    value={jpegQuality}
                    onChange={(e) => setJpegQuality(Number(e.target.value))}
                  />
                </label>
              ) : null}
              {format !== 'pdf' && pageCount > 1 ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-stone-700">{t('export.pages')}</span>
                  <Select
                    aria-label={t('export.pages')}
                    value={String(pageChoice)}
                    onValueChange={(value) =>
                      setPageChoice(value === 'all' ? 'all' : Number(value))
                    }
                    items={[
                      { value: 'all', label: t('export.allPages', { count: pageCount }) },
                      ...Array.from({ length: pageCount }, (_, i) => ({
                        value: String(i + 1),
                        label: t('export.page', { number: i + 1 }),
                      })),
                    ]}
                  />
                </div>
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
              {t('export.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={busy || (isPicture && pageCount === 0)}
              onClick={() => void start()}
            >
              <DownloadIcon /> {busy ? t('export.busy') : t('export.run', { format: info.label })}
            </Button>
          </div>
        </div>
      ) : null}

      {job && pages
        ? createPortal(
            <div
              ref={stageRef}
              aria-hidden="true"
              className="pointer-events-none fixed top-0"
              style={{ left: -100_000 }}
            >
              {pages.map((slice, index) => (
                <PageSheet
                  key={index}
                  doc={job.doc}
                  slice={slice}
                  number={index + 1}
                  total={pages.length}
                />
              ))}
            </div>,
            document.body,
          )
        : null}
    </dialog>
  );
}
