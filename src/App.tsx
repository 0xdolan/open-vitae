import { useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EditorView } from '@/components/editor/EditorView';
import { ResumeLibrary } from '@/components/library/ResumeLibrary';
import { SampleGallery } from '@/components/library/SampleGallery';
import { StorageNotice } from '@/components/StorageNotice';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/Toaster';
import { useHashRoute } from '@/hooks/useHashRoute';
import { useFontStore, useResumeStore } from '@/stores';

function Messages() {
  const message = useResumeStore((s) => s.message);
  const invalidCount = useResumeStore((s) => s.invalidCount);
  const dismissMessage = useResumeStore((s) => s.dismissMessage);
  return (
    <>
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
          {invalidCount === 1 ? 'One saved resume' : `${invalidCount} saved resumes`} could not be read and{' '}
          {invalidCount === 1 ? 'was' : 'were'} left untouched.
        </p>
      ) : null}
    </>
  );
}

function LibraryView() {
  const clearAll = useResumeStore((s) => s.clearAll);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-brand text-3xl font-bold tracking-tight">Open Vitae</h1>
        <p className="text-stone-600">A private resume builder that runs entirely in your browser.</p>
      </header>
      <StorageNotice />
      <Messages />
      <ResumeLibrary />
      <SampleGallery />
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4 text-sm text-stone-500">
        <p>Free software under GPL-3.0.</p>
        <Button variant="danger-ghost" size="sm" onClick={() => setConfirmClear(true)}>
          Delete all data in this browser
        </Button>
      </footer>
      <ConfirmDialog
        open={confirmClear}
        title="Delete all data?"
        description="Every resume, every saved version, every font you loaded, every draft and setting stored by Open Vitae in this browser will be removed. This cannot be undone. Export backups first if you might need them."
        confirmLabel="Delete everything"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          void clearAll().then(() => useFontStore.getState().reset());
          setConfirmClear(false);
        }}
      />
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-bold">This resume is not in this browser</h1>
      <p className="mt-2 text-stone-600">It may have been deleted, or it was saved in another browser or device.</p>
      <a href="#/" className="text-brand mt-4 inline-block font-semibold underline">
        Back to my resumes
      </a>
    </div>
  );
}

export function App() {
  const init = useResumeStore((s) => s.init);
  const flush = useResumeStore((s) => s.flush);
  const status = useResumeStore((s) => s.status);
  const setActive = useResumeStore((s) => s.setActive);
  const route = useHashRoute();
  const doc = useResumeStore((s) => (route.name === 'editor' ? s.resumes[route.id] : undefined));

  useEffect(() => {
    void init();
    void useFontStore.getState().init();
  }, [init]);

  // The open resume follows the address, so links, reloads and the back button all work.
  useEffect(() => {
    if (route.name === 'editor' && status === 'ready') setActive(route.id);
  }, [route, status, setActive]);

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

  let content;
  if (status === 'idle' || status === 'loading') {
    content = <p className="text-sm text-stone-600">Loading your resumes…</p>;
  } else if (route.name === 'library') {
    content = <LibraryView />;
  } else if (doc) {
    content = (
      <>
        <Messages />
        <EditorView doc={doc} />
      </>
    );
  } else {
    content = <NotFound />;
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[110rem] flex-col gap-4 p-3 sm:p-6">
      <main>{content}</main>
      <Toaster />
    </div>
  );
}
