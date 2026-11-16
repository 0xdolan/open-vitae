import { useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DownloadIcon, UploadIcon } from '@/components/ui/icons';
import { Select } from '@/components/ui/select';
import { useDismiss } from '@/hooks/useDismiss';
import { navigate } from '@/hooks/useHashRoute';
import { downloadFile } from '@/lib/download';
import { IMPORT_ACCEPT, type DataFormat } from '@/config/export';
import { createResumeFromSample, SAMPLES, type SampleId } from '@/samples';
import { toast, useResumeStore } from '@/stores';
import { useT } from '@/i18n';

const TEMPLATE_FORMATS: readonly { id: DataFormat; label: string }[] = [
  { id: 'xlsx', label: 'Excel (.xlsx)' },
  { id: 'csv', label: 'CSV' },
  { id: 'markdown', label: 'Markdown (.md)' },
  { id: 'json', label: 'JSON' },
];

/** Import a resume file, or download a template or sample to fill in and import. */
export function ImportAndTemplates() {
  const t = useT();
  const importDocument = useResumeStore((s) => s.importDocument);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [source, setSource] = useState<'template' | SampleId>('template');
  const [format, setFormat] = useState<DataFormat>('xlsx');
  const rootRef = useRef<HTMLDivElement>(null);
  useDismiss(templateOpen, [rootRef], () => setTemplateOpen(false));

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      // Import code (Markdown, Excel and CSV readers) loads only when someone imports.
      const { FORMAT_LABELS, importResumeFile } = await import('@/lib/interchange/import-file');
      const { doc, format: detected, warnings } = await importResumeFile(file);
      const saved = await importDocument(doc);
      if (saved) {
        navigate({ name: 'editor', id: saved.id });
        const note =
          warnings.length > 0
            ? ` ${t('import.skipped', { count: warnings.length })} ${warnings.slice(0, 2).join(' ')}`
            : '';
        toast.success(
          t('import.done'),
          `${t('import.doneBody', { name: saved.name, format: FORMAT_LABELS[detected] })}${note}`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error && error.name === 'ImportError'
          ? error.message
          : t('import.unreadable');
      toast.error(t('import.failed'), message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const downloadTemplate = async () => {
    const [{ buildDataFile }, { createTemplateResume }] = await Promise.all([
      import('@/lib/export/data-formats'),
      import('@/lib/interchange/template'),
    ]);
    const doc =
      source === 'template' ? createTemplateResume() : createResumeFromSample(source, 'Sample');
    const file = await buildDataFile(doc, format, {
      version: null,
      appVersion: __APP_VERSION__,
      now: new Date(),
    });
    downloadFile(file.fileName, file.blob, file.blob.type);
    toast.success(t('templates.done'), t('templates.doneBody', { file: file.fileName }));
    setTemplateOpen(false);
  };

  return (
    <div ref={rootRef} className="relative flex flex-wrap gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={IMPORT_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <Button disabled={busy} onClick={() => inputRef.current?.click()} title={t('import.hint')}>
        <UploadIcon /> {busy ? t('import.busy') : t('import.button')}
      </Button>
      <Button
        aria-expanded={templateOpen}
        aria-controls={`${id}-templates`}
        onClick={() => setTemplateOpen((o) => !o)}
      >
        <DownloadIcon /> {t('templates.button')}
      </Button>

      {templateOpen ? (
        <div
          id={`${id}-templates`}
          role="group"
          aria-label={t('templates.label')}
          className="bg-popover absolute top-full end-0 z-20 mt-2 flex w-[min(34rem,calc(100vw-2rem))] flex-wrap items-end gap-2 rounded-lg border border-stone-200 p-3 text-sm shadow-lg"
        >
          <div className="flex min-w-48 flex-1 flex-col gap-1">
            <label htmlFor={`${id}-source`} className="text-xs font-medium text-stone-700">
              {t('templates.from')}
            </label>
            <Select
              id={`${id}-source`}
              value={source}
              onValueChange={(value) => setSource(value as 'template' | SampleId)}
              items={[
                { value: 'template', label: t('templates.blank') },
                ...SAMPLES.map((sample) => ({
                  value: sample.id,
                  label: t('templates.sample', { name: t(`samples.${sample.id}.label`) }),
                })),
              ]}
            />
          </div>
          <div className="flex min-w-32 flex-col gap-1">
            <label htmlFor={`${id}-format`} className="text-xs font-medium text-stone-700">
              {t('templates.format')}
            </label>
            <Select
              id={`${id}-format`}
              value={format}
              onValueChange={(value) => setFormat(value as DataFormat)}
              items={TEMPLATE_FORMATS.map((option) => ({ value: option.id, label: option.label }))}
            />
          </div>
          <Button variant="primary" onClick={() => void downloadTemplate()}>
            {t('templates.download')}
          </Button>
          <p className="basis-full text-xs text-stone-500">{t('templates.help')}</p>
        </div>
      ) : null}
    </div>
  );
}
