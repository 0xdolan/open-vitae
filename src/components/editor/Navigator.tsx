import { useId, useRef } from 'react';

import { EyeIcon, EyeOffIcon, GripIcon, PlusIcon } from '@/components/ui/icons';
import { SortableList } from '@/components/ui/sortable';
import { LIMITS } from '@/config/layout';
import { defaultSectionTitle, SECTION_KINDS, type SectionKind } from '@/config/sections';
import { addSection, moveSection, updateSection } from '@/lib/document-ops';
import { cn } from '@/lib/utils';
import type { ResumeDocument } from '@/schema/resume';
import { useResumeStore } from '@/stores';

export type Panel =
  | { readonly kind: 'page' }
  | { readonly kind: 'profile' }
  | { readonly kind: 'versions' }
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
        Resume sections
      </h2>

      <button
        type="button"
        className={entryClass(panel.kind === 'page')}
        aria-current={panel.kind === 'page' ? 'page' : undefined}
        onClick={() => onSelect({ kind: 'page' })}
      >
        Page setup
      </button>
      <button
        type="button"
        className={entryClass(panel.kind === 'profile')}
        aria-current={panel.kind === 'profile' ? 'page' : undefined}
        onClick={() => onSelect({ kind: 'profile' })}
      >
        Profile
      </button>

      <p className="mt-3 mb-1 px-2.5 text-xs font-semibold tracking-wide text-stone-500 uppercase">
        Sections · drag to reorder
      </p>

      <SortableList
        label="Sections, in page order"
        items={doc.sections}
        getId={(section) => section.id}
        getLabel={(section) => section.title || 'Untitled section'}
        onMove={(from, to) => updateActive((d) => moveSection(d, from, to))}
        className="flex flex-col gap-0.5"
        renderItem={(section, { handleProps, isDragging, isDropTarget }) => {
          const active = panel.kind === 'section' && panel.id === section.id;
          const title = section.title || 'Untitled section';
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
                className={cn(entryClass(active), 'flex-1', !section.visible && 'text-stone-400')}
                aria-current={active ? 'page' : undefined}
                onClick={() => onSelect({ kind: 'section', id: section.id })}
              >
                <span className="min-w-0 flex-1 truncate" dir="auto">
                  {title}
                </span>
                <span className="text-xs text-stone-400">{section.items.length}</span>
              </button>
              <button
                type="button"
                className="rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-ink"
                aria-pressed={!section.visible}
                aria-label={section.visible ? `Hide ${title}` : `Show ${title}`}
                title={section.visible ? 'Hide on the page' : 'Show on the page'}
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
          <PlusIcon /> Add section
        </summary>
        <ul
          className="mt-1 grid grid-cols-2 gap-1 rounded-lg border border-stone-200 bg-white p-1.5 shadow-sm"
          aria-label="Section types"
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
        <span className="flex-1">Version history</span>
        <span className="text-xs text-stone-400">{versionCount}</span>
      </button>
    </nav>
  );
}
