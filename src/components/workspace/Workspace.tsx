import { useId, useState } from 'react';

import { PagePreview } from '@/components/PagePreview';
import { ResumeRenderer } from '@/components/resume/ResumeRenderer';
import { controlClass, Field } from '@/components/ui/field';
import type { ResumeDocument, ResumeLayout } from '@/schema/resume';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/datetime';
import { toast, useResumeStore } from '@/stores';

import { PageSettings } from './PageSettings';
import { SaveIndicator } from './SaveIndicator';
import { VersionHistory } from './VersionHistory';

/** Editing area for the open resume: name, page settings and the live preview. */
export function Workspace({ doc }: { readonly doc: ResumeDocument }) {
  const nameId = useId();
  const updateActive = useResumeStore((s) => s.updateActive);
  const saveState = useResumeStore((s) => s.saveState);
  const latest = useResumeStore((s) => s.versions[0]);
  const exportJson = useResumeStore((s) => s.exportJson);
  const [exporting, setExporting] = useState(false);

  const exportBackup = async () => {
    setExporting(true);
    const result = await exportJson();
    setExporting(false);
    if (result) {
      const saved = result.version
        ? ` Version ${result.version.number}, saved ${formatDateTime(result.version.savedAt)}.`
        : '';
      toast.success('Export complete', `${result.fileName} is in your downloads.${saved}`);
    }
  };

  const updateLayout = (patch: Partial<ResumeLayout>) =>
    updateActive((current) => ({ ...current, layout: { ...current.layout, ...patch } }));

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Field label="Resume name" htmlFor={nameId} className="w-full max-w-sm">
          <input
            id={nameId}
            className={controlClass}
            value={doc.name}
            maxLength={120}
            dir="auto"
            onChange={(e) => updateActive((current) => ({ ...current, name: e.target.value }))}
          />
        </Field>
        <div className="flex flex-col items-end gap-1.5">
          <Button variant="primary" onClick={() => void exportBackup()} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export JSON backup'}
          </Button>
          <SaveIndicator state={saveState} latest={latest} />
        </div>
      </div>

      <PageSettings layout={doc.layout} onChange={updateLayout} />

      <VersionHistory />

      <div className="rounded-xl bg-stone-200/60 p-3 sm:p-6">
        <PagePreview
          pageSize={doc.layout.pageSize}
          orientation={doc.layout.orientation}
          marginMm={doc.layout.marginMm}
        >
          <ResumeRenderer doc={doc} />
        </PagePreview>
      </div>
    </div>
  );
}
