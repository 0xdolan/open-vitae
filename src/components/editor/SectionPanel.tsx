import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { ChevronIcon, CopyIcon, EyeIcon, EyeOffIcon, GripIcon, PlusIcon, TrashIcon } from '@/components/ui/icons';
import { SortableList } from '@/components/ui/sortable';
import { TextField } from '@/components/ui/text-field';
import { LIMITS } from '@/config/layout';
import { itemFieldLabels } from '@/config/sections';
import {
  addItem,
  duplicateItem,
  duplicateSection,
  insertSection,
  moveItem,
  removeItem,
  removeSection,
  updateItem,
  updateSection,
} from '@/lib/document-ops';
import { urlError } from '@/lib/field-validation';
import { cn } from '@/lib/utils';
import type { ResumeDocument, ResumeItem, ResumeSection } from '@/schema/resume';
import { toast, useResumeStore } from '@/stores';

import { RichTextField } from '@/components/rich-text/RichTextField';
import { PanelHeading } from './PanelHeading';

interface SectionPanelProps {
  readonly doc: ResumeDocument;
  readonly section: ResumeSection;
  /** Called with the id of a newly created section, or null when this one is deleted. */
  readonly onSelectSection: (id: string | null) => void;
}

function ItemCard({
  doc,
  section,
  item,
  open,
  onToggle,
  dragHandle,
  highlight,
}: {
  readonly doc: ResumeDocument;
  readonly section: ResumeSection;
  readonly item: ResumeItem;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly dragHandle: ReactNode;
  readonly highlight: string;
}) {
  const updateActive = useResumeStore((s) => s.updateActive);
  const labels = itemFieldLabels(section.kind);
  const set = (patch: Partial<Omit<ResumeItem, 'id'>>, field: string) =>
    updateActive((d) => updateItem(d, section.id, item.id, patch), { group: `item.${item.id}.${field}` });
  const heading = item.title || 'Untitled entry';

  return (
    <div className={cn('rounded-lg border bg-white', highlight, !item.visible && 'opacity-60')}>
      <div className="flex items-center gap-1 p-1.5">
        {dragHandle}
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded px-1.5 py-1 text-start hover:bg-stone-50"
          aria-expanded={open}
          onClick={onToggle}
        >
          <ChevronIcon className={cn('shrink-0 transition-transform rtl:-scale-x-100', open && 'rotate-90 rtl:rotate-90')} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold" dir="auto">
              {heading}
            </span>
            {item.subtitle || item.dateRange ? (
              <span className="block truncate text-xs text-stone-500" dir="auto">
                {[item.subtitle, item.dateRange].filter(Boolean).join(' · ')}
              </span>
            ) : null}
          </span>
        </button>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={!item.visible}
          aria-label={item.visible ? `Hide ${heading}` : `Show ${heading}`}
          title={item.visible ? 'Hide on the page' : 'Show on the page'}
          onClick={() => updateActive((d) => updateItem(d, section.id, item.id, { visible: !item.visible }))}
        >
          {item.visible ? <EyeIcon /> : <EyeOffIcon />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Duplicate ${heading}`}
          title="Duplicate"
          disabled={section.items.length >= LIMITS.itemsPerSection}
          onClick={() => updateActive((d) => duplicateItem(d, section.id, item.id).doc)}
        >
          <CopyIcon />
        </Button>
        <Button
          variant="danger-ghost"
          size="sm"
          aria-label={`Delete ${heading}`}
          title="Delete"
          onClick={() => updateActive((d) => removeItem(d, section.id, item.id))}
        >
          <TrashIcon />
        </Button>
      </div>

      {open ? (
        <div className="grid gap-3 border-t border-stone-200 p-3 sm:grid-cols-2">
          <TextField label={labels.title} className="sm:col-span-2" value={item.title} maxLength={300} onChange={(title) => set({ title }, 'title')} />
          <TextField label={labels.subtitle} className="sm:col-span-2" value={item.subtitle} maxLength={300} onChange={(subtitle) => set({ subtitle }, 'subtitle')} />
          <TextField label={labels.dateRange} value={item.dateRange} maxLength={100} placeholder="2022 – Present" onChange={(dateRange) => set({ dateRange }, 'dateRange')} />
          <TextField label={labels.location} value={item.location} maxLength={120} onChange={(location) => set({ location }, 'location')} />
          <TextField
            label={labels.url}
            type="url"
            className="sm:col-span-2"
            value={item.url}
            placeholder="https://"
            error={urlError(item.url)}
            onChange={(url) => set({ url: url.trim() }, 'url')}
          />
          <div className="sm:col-span-2">
            <RichTextField
              label={labels.description}
              html={item.descriptionHtml}
              language={doc.language}
              accentColor={doc.layout.accentColor}
              indentCh={doc.layout.indentCh}
              maxDepth={doc.layout.maxDepth}
              onChange={(descriptionHtml) => set({ descriptionHtml }, 'description')}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Edit one section: its title, visibility, page break and entries. */
export function SectionPanel({ doc, section, onSelectSection }: SectionPanelProps) {
  const updateActive = useResumeStore((s) => s.updateActive);
  const [openItems, setOpenItems] = useState<ReadonlySet<string>>(() => new Set(section.items.slice(0, 1).map((i) => i.id)));
  const headingId = `section-${section.id}-heading`;
  const title = section.title || 'Untitled section';

  const toggle = (id: string) =>
    setOpenItems((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const deleteSection = () => {
    const index = doc.sections.findIndex((s) => s.id === section.id);
    const removed = section;
    updateActive((d) => removeSection(d, section.id));
    onSelectSection(null);
    toast.info('Section deleted', `“${title}” was removed.`, {
      label: 'Undo',
      onClick: () => {
        updateActive((d) => insertSection(d, removed, index));
        onSelectSection(removed.id);
      },
    });
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <PanelHeading
        id={headingId}
        title={title}
        description={`${section.items.length} ${section.items.length === 1 ? 'entry' : 'entries'}${section.visible ? '' : ' · hidden on the page'}`}
        actions={
          <>
            <Button
              size="sm"
              disabled={doc.sections.length >= LIMITS.sections}
              onClick={() => {
                let newId = null as string | null;
                updateActive((d) => {
                  const result = duplicateSection(d, section.id);
                  newId = result.sectionId;
                  return result.doc;
                });
                onSelectSection(newId);
              }}
            >
              <CopyIcon /> Duplicate
            </Button>
            <Button size="sm" variant="danger-ghost" onClick={deleteSection}>
              <TrashIcon /> Delete section
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Section title"
          className="sm:col-span-2"
          value={section.title}
          maxLength={120}
          onChange={(value) => updateActive((d) => updateSection(d, section.id, { title: value }), { group: `section.${section.id}.title` })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-brand size-4"
            checked={section.visible}
            onChange={(e) => updateActive((d) => updateSection(d, section.id, { visible: e.target.checked }))}
          />
          Show on the page
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-brand size-4"
            checked={section.breakBefore}
            onChange={(e) => updateActive((d) => updateSection(d, section.id, { breakBefore: e.target.checked }))}
          />
          Start on a new page
          {doc.layout.pageBreaks === 'smart' ? <span className="text-xs text-stone-500">(when page breaks are manual)</span> : null}
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-stone-700">Entries</h3>
        {section.items.length === 0 ? <p className="text-sm text-stone-500">No entries yet.</p> : null}
        <SortableList
          label={`Entries in ${title}`}
          items={section.items}
          getId={(item) => item.id}
          getLabel={(item) => item.title || 'Untitled entry'}
          onMove={(from, to) => updateActive((d) => moveItem(d, section.id, from, to))}
          className="flex flex-col gap-2"
          renderItem={(item, { handleProps, isDragging, isDropTarget }) => (
            <ItemCard
              doc={doc}
              section={section}
              item={item}
              open={openItems.has(item.id)}
              onToggle={() => toggle(item.id)}
              highlight={isDragging ? 'border-brand shadow-lg' : isDropTarget ? 'border-brand border-dashed' : 'border-stone-200'}
              dragHandle={
                <button type="button" className="rounded p-1.5 text-stone-400 hover:text-ink" {...handleProps}>
                  <GripIcon />
                </button>
              }
            />
          )}
        />
        <Button
          size="sm"
          className="self-start"
          disabled={section.items.length >= LIMITS.itemsPerSection}
          onClick={() => {
            let newId = null as string | null;
            updateActive((d) => {
              const result = addItem(d, section.id);
              newId = result.itemId;
              return result.doc;
            });
            const created = newId;
            if (created) setOpenItems((current) => new Set(current).add(created));
          }}
        >
          <PlusIcon /> Add entry
        </Button>
      </div>
    </section>
  );
}
