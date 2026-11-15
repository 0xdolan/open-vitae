import { useId, useRef } from 'react';

import { EyeIcon, EyeOffIcon, GripIcon, PlusIcon } from '@/components/ui/icons';
import { SortableList } from '@/components/ui/sortable';
import { LIMITS } from '@/config/layout';
import { defaultSectionTitle, SECTION_KINDS, type SectionKind } from '@/config/sections';
import { addSection, moveSection, updateSection } from '@/lib/document-ops';
import { cn } from '@/lib/utils';
import type { ResumeDocument } from '@/schema/resume';
import { useResumeStore } from '@/stores';
import { useT } from '@/i18n';

export type Panel =
  | { readonly kind: 'page' }
  | { readonly kind: 'profile' }
  | { readonly kind: 'versions' }
  | { readonly kind: 'grammar' }
  | { readonly kind: 'section'; readonly id: string };

interface NavigatorProps {
  readonly doc: ResumeDocument;
  readonly panel: Panel;
  readonly onSelect: (panel: Panel) => void;
}

const entryClass = (active: boolean) =>
  cn(
    'flex w-full min-w-0 items-center gap-2 rounded-md px-2.5 py-2 text-start text-sm',
    active ? 'bg-brand-soft text-brand font-semibold' : 'hover:bg-stone-100',
  );

/**
 * The side panel: page setup, profile, every section (drag to reorder, eye to
 * show or hide), adding sections, and the version history.
 */
export function Navigator({ doc, panel, onSelect }: NavigatorProps) {
  const t = useT();
  const updateActive = useResumeStore((s) => s.updateActive);
  const versionCount = useResumeStore((s) => s.versions.length);
  const addMenu = useRef<HTMLDetailsElement>(null);
  const headingId = useId();

  const add = (kind: SectionKind) => {
    let created = null as string | null;
    updateActive((d) => {
      const result = addSection(d, kind);
      created = result.sectionId;
      return result.doc;
    });
    if (addMenu.current) addMenu.current.open = false;
    if (created) onSelect({ kind: 'section', id: created });
  };

  return (
    <nav aria-labelledby={headingId} className="flex flex-col gap-1">
      <h2 id={headingId} className="sr-only">
        {t('nav.heading')}
      </h2>

      <button
        type="button"
        className={entryClass(panel.kind === 'page')}
        aria-current={panel.kind === 'page' ? 'page' : undefined}
        onClick={() => onSelect({ kind: 'page' })}
      >
        {t('nav.page')}
      </button>
      <button
        type="button"
        className={entryClass(panel.kind === 'profile')}
        aria-current={panel.kind === 'profile' ? 'page' : undefined}
        onClick={() => onSelect({ kind: 'profile' })}
      >
        {t('nav.profile')}
      </button>

      <p className="mt-3 mb-1 px-2.5 text-xs font-semibold tracking-wide text-stone-500 uppercase">
        {t('nav.sections')}
      </p>

      <SortableList
        label={t('nav.sectionsList')}
        items={doc.sections}
        getId={(section) => section.id}
        getLabel={(section) => section.title || t('nav.untitledSection')}
        onMove={(from, to) => updateActive((d) => moveSection(d, from, to))}
        className="flex flex-col gap-0.5"
        renderItem={(section, { handleProps, isDragging, isDropTarget }) => {
          const active = panel.kind === 'section' && panel.id === section.id;
          const title = section.title || t('nav.untitledSection');
          return (
            <div
              className={cn(
                'flex items-center gap-0.5 rounded-md',
                isDragging && 'bg-white shadow-lg ring-1 ring-brand',
                isDropTarget && 'ring-1 ring-brand ring-dashed',
              )}
            >
              <button
                type="button"
                className="rounded p-1.5 text-stone-400 hover:text-ink"
                {...handleProps}
              >
                <GripIcon />
              </button>
              <button
                type="button"
                className={cn(entryClass(active), 'flex-1', !section.visible && 'text-stone-500')}
                aria-current={active ? 'page' : undefined}
                onClick={() => onSelect({ kind: 'section', id: section.id })}
              >
                <span className="min-w-0 flex-1 truncate" dir="auto">
                  {title}
                </span>
                <span className="text-xs text-stone-600">{t.num(section.items.length)}</span>
              </button>
              <button
                type="button"
                className="rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-ink"
                aria-pressed={!section.visible}
                aria-label={
                  section.visible ? t('nav.hide', { name: title }) : t('nav.show', { name: title })
                }
                title={section.visible ? t('nav.hideTitle') : t('nav.showTitle')}
                onClick={() =>
                  updateActive((d) => updateSection(d, section.id, { visible: !section.visible }))
                }
              >
                {section.visible ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          );
        }}
      />

      <details ref={addMenu} className="group mt-1">
        <summary
          className={cn(
            'flex cursor-pointer list-none items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-brand hover:bg-stone-100',
            doc.sections.length >= LIMITS.sections && 'pointer-events-none opacity-50',
          )}
        >
          <PlusIcon /> {t('nav.add')}
        </summary>
        <ul
          className="mt-1 grid grid-cols-2 gap-1 rounded-lg border border-stone-200 bg-white p-1.5 shadow-sm"
          aria-label={t('nav.types')}
        >
          {SECTION_KINDS.map((kind) => (
            <li key={kind}>
              <button
                type="button"
                className="w-full rounded px-2 py-1.5 text-start text-sm hover:bg-stone-100"
                onClick={() => add(kind)}
                dir="auto"
              >
                {defaultSectionTitle(kind, doc.language)}
              </button>
            </li>
          ))}
        </ul>
      </details>

      <button
        type="button"
        className={cn(entryClass(panel.kind === 'versions'), 'mt-3')}
        aria-current={panel.kind === 'versions' ? 'page' : undefined}
        onClick={() => onSelect({ kind: 'versions' })}
      >
        <span className="flex-1">{t('nav.versions')}</span>
        <span className="text-xs text-stone-600">{t.num(versionCount)}</span>
      </button>
      <button
        type="button"
        className={entryClass(panel.kind === 'grammar')}
        aria-current={panel.kind === 'grammar' ? 'page' : undefined}
        onClick={() => onSelect({ kind: 'grammar' })}
      >
        <span className="flex-1">{t('grammar.nav')}</span>
      </button>
    </nav>
  );
}
