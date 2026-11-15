import { useId } from 'react';

import { PagePreview } from '@/components/PagePreview';
import { ResumeRenderer } from '@/components/resume/ResumeRenderer';
import { controlClass, Field } from '@/components/ui/field';
import type { ResumeDocument, ResumeLayout } from '@/schema/resume';
import { useResumeStore } from '@/stores';

import { PageSettings } from './PageSettings';
import { SaveIndicator } from './SaveIndicator';

/** Editing area for the open resume: name, page settings and the live preview. */
export function Workspace({ doc }: { readonly doc: ResumeDocument }) {
  const nameId = useId();
  const updateActive = useResumeStore((s) => s.updateActive);
  const saveState = useResumeStore((s) => s.saveState);

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
        <SaveIndicator state={saveState} />
      </div>

      <PageSettings layout={doc.layout} onChange={updateLayout} />

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
