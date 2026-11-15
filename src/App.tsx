import { useEffect, useRef, useState } from 'react';

import { InstallButton, OfflineBadge } from '@/components/AppStatus';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EditorView } from '@/components/editor/EditorView';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ResumeLibrary } from '@/components/library/ResumeLibrary';
import { SampleGallery } from '@/components/library/SampleGallery';
import { StorageNotice } from '@/components/StorageNotice';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/Toaster';
import { useHashRoute } from '@/hooks/useHashRoute';
import { applyDocumentLocale, useT } from '@/i18n';
import { useFontStore, useResumeStore } from '@/stores';

function Messages() {
  const t = useT();
  const message = useResumeStore((s) => s.message);
  const invalidCount = useResumeStore((s) => s.invalidCount);
  const dismissMessage = useResumeStore((s) => s.dismissMessage);
  return (
    <>
      {message ? (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          <p>{message}</p>
          <Button variant="ghost" size="sm" onClick={dismissMessage}>
            {t('app.dismiss')}
          </Button>
        </div>
      ) : null}
      {invalidCount > 0 ? (
        <p role="status" className="rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm">
          {t('app.unreadable', { count: invalidCount })}
        </p>
      ) : null}
    </>
  );
}

function LibraryView() {
  const t = useT();
  const clearAll = useResumeStore((s) => s.clearAll);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="text-brand text-3xl font-bold tracking-tight"
            tabIndex={-1}
            id="page-title"
          >
            {t('app.name')}
          </h1>
          <p className="text-stone-600">{t('app.tagline')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <InstallButton />
          <LanguageSwitcher />
        </div>
      </header>
      <StorageNotice />
      <Messages />
      <ResumeLibrary />
      <SampleGallery />
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4 text-sm text-stone-500">
        <p>{t('app.licence')}</p>
        <Button variant="danger-ghost" size="sm" onClick={() => setConfirmClear(true)}>
          {t('app.deleteAll')}
        </Button>
      </footer>
      <ConfirmDialog
        open={confirmClear}
        title={t('app.deleteAllTitle')}
        description={t('app.deleteAllBody')}
        confirmLabel={t('app.deleteAllConfirm')}
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
  const t = useT();
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-bold" tabIndex={-1} id="page-title">
        {t('app.notFoundTitle')}
      </h1>
      <p className="mt-2 text-stone-600">{t('app.notFoundBody')}</p>
      <a href="#/" className="text-brand mt-4 inline-block font-semibold underline">
        {t('app.backToLibrary')}
      </a>
    </div>
  );
}

export function App() {
  const t = useT();
  const init = useResumeStore((s) => s.init);
  const flush = useResumeStore((s) => s.flush);
  const status = useResumeStore((s) => s.status);
  const setActive = useResumeStore((s) => s.setActive);
  const route = useHashRoute();
  const doc = useResumeStore((s) => (route.name === 'editor' ? s.resumes[route.id] : undefined));

  // After moving between pages, put keyboard and screen reader focus on the new
  // page's heading (or the main area), as a full page load would.
  const routeKey = route.name === 'editor' ? `editor:${route.id}` : route.name;
  const firstRoute = useRef(true);
  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById('page-title') ?? document.getElementById('main');
      target?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [routeKey]);

  // The page language and direction follow the interface language.
  useEffect(() => applyDocumentLocale(t.locale), [t.locale]);

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
    content = <p className="text-sm text-stone-600">{t('app.loading')}</p>;
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
      <a
        href="#main"
        className="bg-brand sr-only fixed top-2 start-2 z-50 rounded-md px-3 py-2 text-white focus:not-sr-only"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        {t('app.skipToContent')}
      </a>
      <main id="main" tabIndex={-1} className="outline-none">
        {content}
      </main>
      <OfflineBadge />
      <Toaster />
    </div>
  );
}
