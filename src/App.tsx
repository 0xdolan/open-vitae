import { useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ResumeLibrary } from '@/components/library/ResumeLibrary';
import { SampleGallery } from '@/components/library/SampleGallery';
import { StorageNotice } from '@/components/StorageNotice';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/Toaster';
import { Workspace } from '@/components/workspace/Workspace';
import { selectActiveResume, useResumeStore } from '@/stores';

export function App() {
  const init = useResumeStore((s) => s.init);
  const flush = useResumeStore((s) => s.flush);
  const status = useResumeStore((s) => s.status);
  const message = useResumeStore((s) => s.message);
  const invalidCount = useResumeStore((s) => s.invalidCount);
  const dismissMessage = useResumeStore((s) => s.dismissMessage);
  const clearAll = useResumeStore((s) => s.clearAll);
  const active = useResumeStore(selectActiveResume);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    void init();
  }, [init]);

  // Write pending edits when the tab is hidden or closed.
  useEffect(() => {
    const save = () => void flush();
    const onVisibility = () => document.visibilityState === 'hidden' && save();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', save);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', save);
    };
  }, [flush]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[96rem] flex-col gap-4 p-3 sm:p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-brand text-2xl font-bold tracking-tight">Open Vitae</h1>
          <p className="text-sm text-stone-600">A private resume builder that runs entirely in your browser.</p>
        </div>
      </header>

      <StorageNotice />

      {message ? (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p>{message}</p>
          <Button variant="ghost" size="sm" onClick={dismissMessage}>
            Dismiss
          </Button>
        </div>
      ) : null}

      {invalidCount > 0 ? (
        <p role="status" className="rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm">
          {invalidCount === 1 ? 'One saved resume' : `${invalidCount} saved resumes`} could not be read
          and {invalidCount === 1 ? 'was' : 'were'} left untouched.
        </p>
      ) : null}

      <div className="grid flex-1 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <nav aria-label="Resumes" className="flex flex-col gap-6">
          <ResumeLibrary />
          <SampleGallery />
        </nav>

        <main className="min-w-0">
          {status === 'loading' || status === 'idle' ? (
            <p className="text-sm text-stone-600">Loading your resumes…</p>
          ) : active ? (
            <Workspace doc={active} />
          ) : (
            <div className="flex h-full min-h-64 items-center justify-center rounded-xl border border-dashed border-stone-300 p-8 text-center">
              <p className="max-w-sm text-stone-600">
                Pick a sample to see how a finished resume looks, or start a new one from scratch.
              </p>
            </div>
          )}
        </main>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4 text-sm text-stone-500">
        <p>Free software under GPL-3.0.</p>
        <Button variant="danger-ghost" size="sm" onClick={() => setConfirmClear(true)}>
          Delete all data in this browser
        </Button>
      </footer>

      <Toaster />

      <ConfirmDialog
        open={confirmClear}
        title="Delete all data?"
        description="Every resume, every saved version, every draft and setting stored by Open Vitae in this browser will be removed. This cannot be undone. Export backups first if you might need them."
        confirmLabel="Delete everything"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          void clearAll();
          setConfirmClear(false);
        }}
      />
    </div>
  );
}
