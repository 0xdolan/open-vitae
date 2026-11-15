import { useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DownloadIcon, UploadIcon } from '@/components/ui/icons';
import { navigate } from '@/hooks/useHashRoute';
import { downloadFile } from '@/lib/download';
import { IMPORT_ACCEPT, type DataFormat } from '@/config/export';
import { createResumeFromSample, SAMPLES, type SampleId } from '@/samples';
import { toast, useResumeStore } from '@/stores';

const TEMPLATE_FORMATS: readonly { id: DataFormat; label: string }[] = [
  { id: 'xlsx', label: 'Excel (.xlsx)' },
  { id: 'csv', label: 'CSV' },
  { id: 'markdown', label: 'Markdown (.md)' },
  { id: 'json', label: 'JSON' },
];

/** Import a resume file, or download a template or sample to fill in and import. */
export function ImportAndTemplates() {
  const importDocument = useResumeStore((s) => s.importDocument);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [source, setSource] = useState<'template' | SampleId>('template');
  const [format, setFormat] = useState<DataFormat>('xlsx');

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
        const note = warnings.length > 0 ? ` ${warnings.length} row(s) skipped: ${warnings.slice(0, 2).join(' ')}` : '';
        toast.success('Resume imported', `“${saved.name}” was read from ${FORMAT_LABELS[detected]}.${note}`);
      }
    } catch (error) {
      const message = error instanceof Error && error.name === 'ImportError' ? error.message : 'This file could not be read.';
      toast.error('Nothing imported', message);
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
    const doc = source === 'template' ? createTemplateResume() : createResumeFromSample(source, 'Sample');
    const file = await buildDataFile(doc, format, { version: null, appVersion: __APP_VERSION__, now: new Date() });
    downloadFile(file.fileName, file.blob, file.blob.type);
    toast.success('Template downloaded', `${file.fileName} is in your downloads. Fill it in, then import it here.`);
    setTemplateOpen(false);
  };

  return (
    <div className="relative flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={IMPORT_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <Button disabled={busy} onClick={() => inputRef.current?.click()} title="JSON, CSV, Excel or Markdown">
          <UploadIcon /> {busy ? 'Importing…' : 'Import'}
        </Button>
        <Button aria-expanded={templateOpen} aria-controls={`${id}-templates`} onClick={() => setTemplateOpen((o) => !o)}>
          <DownloadIcon /> Templates
        </Button>

      {templateOpen ? (
        <div
          id={`${id}-templates`}
          role="group"
          aria-label="Download a template"
          className="absolute top-full end-0 z-20 mt-2 flex w-[min(34rem,calc(100vw-2rem))] flex-wrap items-end gap-2 rounded-lg border border-stone-200 bg-white p-3 text-sm shadow-lg"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setTemplateOpen(false);
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-stone-700">Start from</span>
            <select
              className="h-9 rounded-md border border-stone-300 bg-white px-2"
              value={source}
              onChange={(e) => setSource(e.target.value as 'template' | SampleId)}
            >
              <option value="template">Blank template</option>
              {SAMPLES.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  Sample: {sample.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-stone-700">Format</span>
            <select
              className="h-9 rounded-md border border-stone-300 bg-white px-2"
              value={format}
              onChange={(e) => setFormat(e.target.value as DataFormat)}
            >
              {TEMPLATE_FORMATS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Button variant="primary" onClick={() => void downloadTemplate()}>
            Download
          </Button>
          <p className="basis-full text-xs text-stone-500">
            Fill it in with any spreadsheet app or text editor, then use Import. Rich text in sheet cells is written in
            Markdown: start lines with “- ” for bullet points.
          </p>
        </div>
      ) : null}
    </div>
  );
}
