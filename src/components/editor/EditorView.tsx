import { useCallback, useEffect, useState } from 'react';

import { FontsManager } from '@/components/fonts/FontsManager';
import { FontStatusNotice } from '@/components/fonts/FontStatusNotice';
import { ExportDialog } from '@/components/export/ExportDialog';
import { FlowMeasure } from '@/components/pages/FlowMeasure';
import { PageStack } from '@/components/pages/PageStack';
import { PrintLayer } from '@/components/pages/PrintLayer';
import { PrintPreview } from '@/components/pages/PrintPreview';
import { Button } from '@/components/ui/button';
import { PrinterIcon } from '@/components/ui/icons';
import { PageSettings } from '@/components/workspace/PageSettings';
import { GrammarPanel } from '@/components/workspace/GrammarPanel';
import { VersionHistory } from '@/components/workspace/VersionHistory';
import { useEditorShortcuts } from '@/hooks/useEditorShortcuts';
import { setLanguage } from '@/lib/document-ops';
import type { PageSlice } from '@/lib/pagination';
import { cn } from '@/lib/utils';
import type { ResumeDocument, ResumeLayout } from '@/schema/resume';
import { useResumeStore } from '@/stores';
import { useT } from '@/i18n';

import { EditorHeader } from './EditorHeader';
import { Navigator, type Panel } from './Navigator';
import { PanelHeading } from './PanelHeading';
import { ProfilePanel } from './ProfilePanel';
import { SectionPanel } from './SectionPanel';

/**
 * The editor: navigator on the reading-start side, the form for the chosen
 * part in the middle, and the live page preview on the reading-end side.
 * On narrow screens, Edit and Preview are tabs.
 */
export function EditorView({ doc }: { readonly doc: ResumeDocument }) {
  const updateActive = useResumeStore((s) => s.updateActive);
  const [panel, setPanel] = useState<Panel>({ kind: 'profile' });
  const t = useT();
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [pages, setPages] = useState<PageSlice[] | null>(null);
  const [printPreview, setPrintPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const closeExport = useCallback(() => setExporting(false), []);
  useEditorShortcuts();

  // If the selected section disappears (deleted, undo, another tab), fall back to the profile.
  const section =
    panel.kind === 'section' ? doc.sections.find((s) => s.id === panel.id) : undefined;
  useEffect(() => {
    if (panel.kind === 'section' && !section) setPanel({ kind: 'profile' });
  }, [panel, section]);

  const select = (next: Panel) => {
    setPanel(next);
    setMobileTab('edit');
  };

  const updateLayout = (patch: Partial<ResumeLayout>) =>
    updateActive((d) => ({ ...d, layout: { ...d.layout, ...patch } }));

  return (
    <div className="flex flex-col gap-4">
      <EditorHeader doc={doc} onExport={() => setExporting(true)} />
      <ExportDialog open={exporting} pages={pages} onClose={closeExport} />
      <PrintPreview
        open={printPreview}
        doc={doc}
        pages={pages}
        onClose={() => setPrintPreview(false)}
      />
      <PrintLayer doc={doc} pages={pages} />
      {/* Measures pages even while the preview tab is hidden on small screens. */}
      <FlowMeasure doc={doc} onPages={setPages} />

      <FontStatusNotice doc={doc} onOpenFonts={() => select({ kind: 'page' })} />

      <div
        role="tablist"
        aria-label={t('editor.views')}
        className="flex gap-1 rounded-lg bg-stone-200/70 p-1 xl:hidden"
      >
        {(['edit', 'preview'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={mobileTab === tab}
            className={cn(
              'flex-1 rounded-md py-1.5 text-sm font-medium',
              mobileTab === tab ? 'bg-white shadow-sm' : 'text-stone-600',
            )}
            onClick={() => setMobileTab(tab)}
          >
            {tab === 'edit' ? t('editor.tabEdit') : t('editor.tabPreview')}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_minmax(0,1.1fr)]">
        <aside
          className={cn(
            'lg:sticky lg:top-4 lg:self-start',
            mobileTab === 'preview' && 'hidden xl:block',
          )}
        >
          <Navigator doc={doc} panel={panel} onSelect={select} />
        </aside>

        <div className={cn('min-w-0', mobileTab === 'preview' && 'hidden xl:block')}>
          {panel.kind === 'profile' ? <ProfilePanel doc={doc} /> : null}
          {panel.kind === 'section' && section ? (
            <SectionPanel
              key={section.id}
              doc={doc}
              section={section}
              onSelectSection={(id) => setPanel(id ? { kind: 'section', id } : { kind: 'profile' })}
            />
          ) : null}
          {panel.kind === 'page' ? (
            <section aria-labelledby="page-heading" className="flex flex-col gap-5">
              <PanelHeading
                id="page-heading"
                title={t('page.title')}
                description={t('page.description')}
              />
              <PageSettings
                layout={doc.layout}
                onChange={updateLayout}
                language={doc.language}
                onLanguageChange={(language) => updateActive((d) => setLanguage(d, language))}
              />
              <FontsManager />
            </section>
          ) : null}
          {panel.kind === 'versions' ? <VersionHistory /> : null}
          {panel.kind === 'grammar' ? <GrammarPanel doc={doc} /> : null}
        </div>

        <div
          className={cn(
            'min-w-0 lg:col-span-2 xl:col-span-1 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:self-start xl:overflow-auto',
            mobileTab === 'edit' && 'hidden xl:block',
          )}
        >
          <div className="rounded-xl bg-stone-200/60 p-3">
            <PageStack
              doc={doc}
              pages={pages}
              label={t('pages.previewLabel')}
              selectedSectionId={panel.kind === 'section' ? panel.id : undefined}
              onSectionClick={(id) => select({ kind: 'section', id })}
              actions={
                <Button size="sm" onClick={() => setPrintPreview(true)}>
                  <PrinterIcon /> {t('pages.printPreview')}
                </Button>
              }
            />
          </div>
          <p className="mt-2 text-center text-xs text-stone-500">{t('editor.clickToEdit')}</p>
        </div>
      </div>
    </div>
  );
}
