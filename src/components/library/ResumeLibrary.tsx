import { useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ImportAndTemplates } from '@/components/library/ImportAndTemplates';
import { Button, buttonVariants } from '@/components/ui/button';
import { navigate, routeHref } from '@/hooks/useHashRoute';
import { formatDateTime, formatRelative } from '@/lib/datetime';
import { sortByUpdated } from '@/lib/resume-factory';
import { cn } from '@/lib/utils';
import type { ResumeDocument } from '@/schema/resume';
import { useResumeStore } from '@/stores';

/** The person's own resumes, newest first, with open, create, duplicate and delete. */
export function ResumeLibrary() {
  const resumes = useResumeStore((s) => s.resumes);
  const createBlank = useResumeStore((s) => s.createBlank);
  const duplicate = useResumeStore((s) => s.duplicate);
  const remove = useResumeStore((s) => s.remove);

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
          My resumes <span className="font-normal text-stone-500">({sorted.length})</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <ImportAndTemplates />
          <Button variant="primary" onClick={() => void createAndOpen('ltr')}>
            New resume
          </Button>
          <Button onClick={() => void createAndOpen('rtl')} lang="fa" dir="rtl">
            رزومه جدید
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-600">
          Nothing here yet. Start a new resume, or copy one of the samples below to see how a
          finished resume looks.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-col rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <a href={routeHref({ name: 'editor', id: doc.id })} className="group block flex-1">
                <span className="group-hover:text-brand block truncate font-semibold" dir="auto">
                  {doc.name || 'Untitled resume'}
                </span>
                <span className="block truncate text-sm text-stone-600" dir="auto">
                  {doc.profile.fullName || 'No name yet'}
                </span>
                <span
                  className="mt-1 block text-xs text-stone-500"
                  title={formatDateTime(doc.updatedAt)}
                >
                  Edited {formatRelative(doc.updatedAt)} · {doc.layout.pageSize.toUpperCase()} ·{' '}
                  {doc.layout.direction.toUpperCase()}
                </span>
              </a>
              <div className="mt-3 flex gap-1">
                <a
                  href={routeHref({ name: 'editor', id: doc.id })}
                  className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
                >
                  Open
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void duplicate(doc.id)}
                  aria-label={`Duplicate ${doc.name}`}
                >
                  Duplicate
                </Button>
                <Button
                  variant="danger-ghost"
                  size="sm"
                  onClick={() => setPendingDelete(doc)}
                  aria-label={`Delete ${doc.name}`}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this resume?"
        description={`“${pendingDelete?.name ?? ''}” and all of its saved versions will be removed from this browser. This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void remove(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </section>
  );
}
