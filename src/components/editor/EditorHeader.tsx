import { useState } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import { RedoIcon, UndoIcon } from '@/components/ui/icons';
import { SaveIndicator } from '@/components/workspace/SaveIndicator';
import { formatDateTime } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import type { ResumeDocument } from '@/schema/resume';
import { toast, useResumeStore } from '@/stores';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl';

export function EditorHeader({ doc }: { readonly doc: ResumeDocument }) {
  const updateActive = useResumeStore((s) => s.updateActive);
  const saveState = useResumeStore((s) => s.saveState);
  const latest = useResumeStore((s) => s.versions[0]);
  const canUndo = useResumeStore((s) => s.canUndo);
  const canRedo = useResumeStore((s) => s.canRedo);
  const undo = useResumeStore((s) => s.undo);
  const redo = useResumeStore((s) => s.redo);
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

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-stone-200 pb-3">
      <a href="#/" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'shrink-0')}>
        <span aria-hidden="true" className="rtl:-scale-x-100">←</span> My resumes
      </a>
      <label className="sr-only" htmlFor="resume-name">
        Resume name
      </label>
      <input
        id="resume-name"
        dir="auto"
        maxLength={120}
        className="min-w-40 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-lg font-bold hover:border-stone-300 focus-visible:border-brand"
        value={doc.name}
        placeholder="Untitled resume"
        onChange={(e) => updateActive((d) => ({ ...d, name: e.target.value }), { group: 'name' })}
      />
      <SaveIndicator state={saveState} latest={latest} />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo} aria-label="Undo" title={`Undo (${mod}+Z)`}>
          <UndoIcon />
        </Button>
        <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo} aria-label="Redo" title={`Redo (${mod}+Shift+Z)`}>
          <RedoIcon />
        </Button>
        <Button variant="primary" size="sm" onClick={() => void exportBackup()} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export JSON'}
        </Button>
      </div>
    </header>
  );
}
