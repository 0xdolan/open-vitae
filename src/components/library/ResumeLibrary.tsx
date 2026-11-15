import { useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { sortByUpdated } from '@/lib/resume-factory';
import { cn } from '@/lib/utils';
import type { ResumeDocument } from '@/schema/resume';
import { useResumeStore } from '@/stores';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** The person's own resumes, newest first, with create, duplicate and delete. */
export function ResumeLibrary() {
  const resumes = useResumeStore((s) => s.resumes);
  const activeId = useResumeStore((s) => s.activeId);
  const setActive = useResumeStore((s) => s.setActive);
  const createBlank = useResumeStore((s) => s.createBlank);
  const duplicate = useResumeStore((s) => s.duplicate);
  const remove = useResumeStore((s) => s.remove);

  const [pendingDelete, setPendingDelete] = useState<ResumeDocument | null>(null);
  const sorted = useMemo(() => sortByUpdated(Object.values(resumes)), [resumes]);

  return (
    <section aria-labelledby="library-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="library-heading" className="text-sm font-bold tracking-wide text-stone-700 uppercase">
          My resumes
        </h2>
        <span className="text-xs text-stone-500">{sorted.length}</span>
      </div>

      <div className="flex gap-2">
        <Button variant="primary" size="sm" className="flex-1" onClick={() => void createBlank('ltr')}>
          New resume
        </Button>
        <Button size="sm" className="flex-1" onClick={() => void createBlank('rtl')} lang="fa">
          رزومه جدید
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-md border border-dashed border-stone-300 p-3 text-sm text-stone-600">
          Nothing here yet. Start a new resume or copy one of the samples below.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {sorted.map((doc) => {
            const active = doc.id === activeId;
            return (
              <li
                key={doc.id}
                className={cn(
                  'rounded-lg border bg-white p-2.5',
                  active ? 'border-brand ring-brand ring-1' : 'border-stone-200',
                )}
              >
                <button
                  type="button"
                  className="block w-full text-start"
                  aria-current={active ? 'true' : undefined}
                  onClick={() => setActive(doc.id)}
                >
                  <span className="block truncate text-sm font-semibold" dir="auto">
                    {doc.name}
                  </span>
                  <span className="block text-xs text-stone-500">
                    Edited {dateFormat.format(new Date(doc.updatedAt))}
                  </span>
                </button>
                <div className="mt-1.5 flex gap-1">
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
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this resume?"
        description={`“${pendingDelete?.name ?? ''}” will be removed from this browser. This cannot be undone.`}
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
