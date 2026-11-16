import { useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ImportAndTemplates } from '@/components/library/ImportAndTemplates';
import { ResumeThumbnail } from '@/components/library/ResumeThumbnail';
import { Button } from '@/components/ui/button';
import { GridIcon, RowsIcon, ThumbnailsIcon } from '@/components/ui/icons';
import { Segmented } from '@/components/ui/segmented';
import { THUMBNAIL_WIDTH_PX } from '@/config/ui';
import { navigate, routeHref } from '@/hooks/useHashRoute';
import { formatDateTime, formatRelative } from '@/lib/datetime';
import { sortByUpdated } from '@/lib/resume-factory';
import { cn } from '@/lib/utils';
import type { ResumeDocument } from '@/schema/resume';
import { useResumeStore } from '@/stores';
import { useUiStore } from '@/stores/ui-store';
import { useT } from '@/i18n';

/**
 * The person's own resumes, newest first, as cards, a list or thumbnails. A
 * whole card opens the resume; duplicate and delete sit on top of it.
 */
export function ResumeLibrary() {
  const t = useT();
  const resumes = useResumeStore((s) => s.resumes);
  const createBlank = useResumeStore((s) => s.createBlank);
  const duplicate = useResumeStore((s) => s.duplicate);
  const remove = useResumeStore((s) => s.remove);
  const view = useUiStore((s) => s.libraryView);
  const setView = useUiStore((s) => s.setLibraryView);

  const [pendingDelete, setPendingDelete] = useState<ResumeDocument | null>(null);
  const sorted = useMemo(() => sortByUpdated(Object.values(resumes)), [resumes]);

  const createAndOpen = async (direction: 'ltr' | 'rtl') => {
    const doc = await createBlank(direction);
    if (doc) navigate({ name: 'editor', id: doc.id });
  };

  return (
    <section aria-labelledby="library-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="library-heading" className="text-lg font-bold">
          {t('library.title')}{' '}
          <span className="font-normal text-stone-500">({t.num(sorted.length)})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {sorted.length > 0 ? (
            <Segmented
              label={t('library.view')}
              value={view}
              onChange={setView}
              options={[
                { value: 'grid', label: t('library.viewGrid'), icon: <GridIcon /> },
                { value: 'list', label: t('library.viewList'), icon: <RowsIcon /> },
                {
                  value: 'thumbnails',
                  label: t('library.viewThumbnails'),
                  icon: <ThumbnailsIcon />,
                },
              ]}
            />
          ) : null}
          <ImportAndTemplates />
          <Button variant="primary" onClick={() => void createAndOpen('ltr')}>
            {t('library.new')}
          </Button>
          <Button onClick={() => void createAndOpen('rtl')}>{t('library.newRtl')}</Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-600">
          {t('library.empty')}
        </p>
      ) : (
        <ul
          className={cn(
            view === 'list' &&
              'flex flex-col divide-y divide-stone-200 rounded-xl border border-stone-200 bg-card',
            view === 'grid' && 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3',
            view === 'thumbnails' &&
              'grid grid-cols-[repeat(auto-fill,minmax(calc(var(--ov-thumb-w)+2rem),1fr))] gap-3',
          )}
          style={{ ['--ov-thumb-w' as string]: `${THUMBNAIL_WIDTH_PX}px` }}
        >
          {sorted.map((doc) => {
            const href = routeHref({ name: 'editor', id: doc.id });
            const name = doc.name || t('library.untitled');
            const meta = (
              <span
                className="block text-xs text-stone-500"
                title={formatDateTime(doc.updatedAt, t.locale)}
              >
                {t('library.edited', {
                  when: formatRelative(doc.updatedAt, new Date(), t.locale),
                })}{' '}
                · {doc.layout.pageSize.toUpperCase()} · {doc.layout.direction.toUpperCase()}
              </span>
            );
            // The title link covers the whole card (::after); the buttons sit above it.
            const actions = (
              <div className="relative z-10 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void duplicate(doc.id)}
                  aria-label={t('library.duplicateNamed', { name: doc.name })}
                >
                  {t('library.duplicate')}
                </Button>
                <Button
                  variant="danger-ghost"
                  size="sm"
                  onClick={() => setPendingDelete(doc)}
                  aria-label={t('library.deleteNamed', { name: doc.name })}
                >
                  {t('library.delete')}
                </Button>
              </div>
            );
            const title = (
              <a
                href={href}
                className="block truncate font-semibold after:absolute after:inset-0 after:rounded-[inherit] after:content-['']"
              >
                <bdi>{name}</bdi>
              </a>
            );
            const person = (
              <span className="block truncate text-sm text-stone-600">
                <bdi>{doc.profile.fullName || t('library.noName')}</bdi>
              </span>
            );

            if (view === 'list') {
              return (
                <li
                  key={doc.id}
                  className="hover:bg-hover relative flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 first:rounded-t-xl last:rounded-b-xl"
                >
                  <div className="min-w-0 flex-1">
                    {title}
                    {person}
                  </div>
                  {meta}
                  {actions}
                </li>
              );
            }
            return (
              <li
                key={doc.id}
                className="group hover:border-stone-300 relative flex flex-col gap-3 rounded-xl border border-stone-200 bg-card p-4 shadow-sm transition-colors hover:shadow"
              >
                {view === 'thumbnails' ? (
                  <ResumeThumbnail
                    doc={doc}
                    className="mx-auto rounded-sm shadow-sm ring-1 ring-stone-200"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="group-hover:text-brand">{title}</div>
                  {person}
                  <div className="mt-1">{meta}</div>
                </div>
                {actions}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t('library.deleteTitle')}
        description={t('library.deleteBody', { name: pendingDelete?.name ?? '' })}
        confirmLabel={t('library.delete')}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void remove(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </section>
  );
}
