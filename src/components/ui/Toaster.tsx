import { cn } from '@/lib/utils';
import { useToastStore, type Toast } from '@/stores/toast-store';
import { useT } from '@/i18n';

function SuccessIcon() {
  return (
    <svg viewBox="0 0 52 52" className="ov-check size-9 shrink-0" aria-hidden="true">
      <circle className="ov-check-circle" cx="26" cy="26" r="24" fill="none" />
      <path className="ov-check-mark" fill="none" d="M15 27 l7 7 l15 -16" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7 shrink-0 text-red-600" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v6M12 16.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ToastItem({ toast }: { readonly toast: Toast }) {
  const t = useT();
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <li
      // Errors interrupt; everything else waits politely.
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'ov-toast pointer-events-auto relative flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 overflow-hidden rounded-xl border bg-white p-4 pe-10 shadow-lg',
        toast.tone === 'success' && 'border-emerald-200',
        toast.tone === 'error' && 'border-red-200',
        toast.tone === 'info' && 'border-stone-200',
      )}
    >
      {toast.tone === 'success' ? <SuccessIcon /> : null}
      {toast.tone === 'error' ? <ErrorIcon /> : null}
      <div className="min-w-0">
        <p className="font-semibold text-ink">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-sm break-words text-stone-600" dir="auto">
            {toast.description}
          </p>
        ) : null}
        {toast.action ? (
          <button
            type="button"
            className="text-brand mt-2 rounded-md text-sm font-semibold underline-offset-2 hover:underline"
            onClick={() => {
              toast.action?.onClick();
              dismiss(toast.id);
            }}
          >
            {toast.action.label}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="absolute end-2 top-2 rounded-md px-2 py-1 text-stone-500 hover:bg-stone-100 hover:text-ink"
        aria-label={t('toast.dismiss')}
      >
        ×
      </button>
      {/* The bar empties over the toast's lifetime; when its animation ends, the toast closes.
          Hovering or focusing the toast pauses it (see .ov-toast in index.css). */}
      {Number.isFinite(toast.durationMs) ? (
        <span
          aria-hidden="true"
          className={cn(
            'ov-toast-progress absolute inset-x-0 bottom-0 h-1 origin-[left]',
            toast.tone === 'success'
              ? 'bg-emerald-500'
              : toast.tone === 'error'
                ? 'bg-red-500'
                : 'bg-stone-400',
          )}
          style={{ animationDuration: `${toast.durationMs}ms` }}
          onAnimationEnd={() => dismiss(toast.id)}
        />
      ) : null}
    </li>
  );
}

/** Notifications in the bottom corner on the reading-end side (right in LTR, left in RTL). */
export function Toaster() {
  const t = useT();
  const toasts = useToastStore((s) => s.toasts);
  return (
    <ol
      aria-label={t('toast.region')}
      className="pointer-events-none fixed end-4 bottom-4 z-50 flex flex-col items-end gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </ol>
  );
}
