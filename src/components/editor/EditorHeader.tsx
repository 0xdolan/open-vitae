import { Button, buttonVariants } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { DownloadIcon, PanelIcon, RedoIcon, UndoIcon } from '@/components/ui/icons';
import { SaveIndicator } from '@/components/workspace/SaveIndicator';
import { cn } from '@/lib/utils';
import type { ResumeDocument } from '@/schema/resume';
import { useResumeStore } from '@/stores';
import { useUiStore } from '@/stores/ui-store';
import { useT } from '@/i18n';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl';

interface EditorHeaderProps {
  readonly doc: ResumeDocument;
  readonly onExport: () => void;
}

export function EditorHeader({ doc, onExport }: EditorHeaderProps) {
  const t = useT();
  const updateActive = useResumeStore((s) => s.updateActive);
  const saveState = useResumeStore((s) => s.saveState);
  const latest = useResumeStore((s) => s.versions[0]);
  const canUndo = useResumeStore((s) => s.canUndo);
  const canRedo = useResumeStore((s) => s.canRedo);
  const undo = useResumeStore((s) => s.undo);
  const redo = useResumeStore((s) => s.redo);
  const previewCollapsed = useUiStore((s) => s.previewCollapsed);
  const setPreviewCollapsed = useUiStore((s) => s.setPreviewCollapsed);
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-stone-200 pb-3">
      <a href="#/" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'shrink-0')}>
        <span aria-hidden="true" className="rtl:-scale-x-100">
          ←
        </span>{' '}
        {t('editor.back')}
      </a>
      <h1 id="page-title" tabIndex={-1} className="sr-only" dir="auto">
        {doc.name || t('library.untitled')}
      </h1>
      <label className="sr-only" htmlFor="resume-name">
        {t('editor.resumeName')}
      </label>
      <input
        id="resume-name"
        dir="auto"
        maxLength={120}
        className="min-w-40 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-lg font-bold hover:border-stone-300 focus-visible:border-brand"
        value={doc.name}
        placeholder={t('library.untitled')}
        onChange={(e) => updateActive((d) => ({ ...d, name: e.target.value }), { group: 'name' })}
      />
      <SaveIndicator state={saveState} latest={latest} />
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          aria-label={t('editor.undo')}
          title={`${t('editor.undo')} (${mod}+Z)`}
        >
          <UndoIcon />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          aria-label={t('editor.redo')}
          title={`${t('editor.redo')} (${mod}+Shift+Z)`}
        >
          <RedoIcon />
        </Button>
        {/* The preview is a side pane only on wide screens; narrow screens use the tabs. */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden xl:inline-flex"
          aria-pressed={!previewCollapsed}
          aria-label={previewCollapsed ? t('editor.showPreview') : t('editor.hidePreview')}
          title={previewCollapsed ? t('editor.showPreview') : t('editor.hidePreview')}
          onClick={() => setPreviewCollapsed(!previewCollapsed)}
        >
          <PanelIcon className="rtl:-scale-x-100" />
        </Button>
        <ThemeSwitcher />
        <Button variant="primary" size="sm" onClick={onExport}>
          <DownloadIcon /> {t('editor.export')}
        </Button>
      </div>
    </header>
  );
}
