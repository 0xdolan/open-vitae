import { useEffect, useId, useState } from 'react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { controlClass, Field } from '@/components/ui/field';
import { parseRetention, RETENTION_OPTIONS } from '@/config/versions';
import { formatDateTime, formatRelative } from '@/lib/datetime';
import { formatBytes } from '@/lib/format';
import type { VersionReason, VersionSummary } from '@/lib/versions/repository';
import { toast, useResumeStore } from '@/stores';

const REASON_LABELS: Record<VersionReason, string> = {
  created: 'Created',
  autosave: 'Autosave',
  manual: 'Named version',
  restore: 'Restored',
  import: 'Imported',
};

const INITIAL_ROWS = 15;

/** Re-render every 30 s so "2 minutes ago" stays true. */
function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function VersionRow({
  version,
  isLatest,
  now,
  onRestore,
  onDownload,
}: {
  readonly version: VersionSummary;
  readonly isLatest: boolean;
  readonly now: Date;
  readonly onRestore: () => void;
  readonly onDownload: () => void;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-200 py-2.5 last:border-b-0">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">Version {version.number}</span>
          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-700">
            {REASON_LABELS[version.reason]}
          </span>
          {isLatest ? (
            <span className="bg-brand-soft text-brand rounded px-1.5 py-0.5 text-xs font-medium">Current</span>
          ) : null}
          {version.exportedAt ? (
            <span
              className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-800"
              title={`Exported ${formatDateTime(version.exportedAt)}`}
            >
              Exported
            </span>
          ) : null}
        </p>
        {version.note ? (
          <p className="mt-0.5 text-sm text-stone-800" dir="auto">
            {version.note}
          </p>
        ) : null}
        <p className="mt-0.5 text-xs text-stone-600">
          <time dateTime={version.savedAt}>{formatDateTime(version.savedAt)}</time>
          <span className="text-stone-400"> · </span>
          {formatRelative(version.savedAt, now)}
          <span className="text-stone-400"> · </span>
          {formatBytes(version.bytes)}
        </p>
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={onDownload} aria-label={`Download version ${version.number} as JSON`}>
          Download
        </Button>
        {!isLatest ? (
          <Button size="sm" onClick={onRestore} aria-label={`Restore version ${version.number}`}>
            Restore
          </Button>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Every save is kept as a version with its date and time. People can name a
 * version, download any version, or restore one; restoring never loses the
 * current state because it is already a version itself.
 */
export function VersionHistory() {
  const id = useId();
  const now = useNow();
  const versions = useResumeStore((s) => s.versions);
  const retention = useResumeStore((s) => s.retention);
  const setRetention = useResumeStore((s) => s.setRetention);
  const saveNamedVersion = useResumeStore((s) => s.saveNamedVersion);
  const restoreVersion = useResumeStore((s) => s.restoreVersion);
  const exportJson = useResumeStore((s) => s.exportJson);

  const [note, setNote] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<VersionSummary | null>(null);

  const latest = versions[0];
  const shown = showAll ? versions : versions.slice(0, INITIAL_ROWS);
  const totalBytes = versions.reduce((sum, v) => sum + v.bytes, 0);

  const saveNamed = async () => {
    const version = await saveNamedVersion(note);
    if (version) {
      setNote('');
      toast.success(`Version ${version.number} saved`, formatDateTime(version.savedAt));
    }
  };

  const download = async (version: VersionSummary) => {
    const result = await exportJson(version.id);
    if (result) toast.success('Export complete', `${result.fileName} is in your downloads.`);
  };

  return (
    <details className="group rounded-xl border border-stone-200 bg-white" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3">
        <span className="font-semibold">
          Version history <span className="font-normal text-stone-500">({versions.length})</span>
        </span>
        <span className="text-xs text-stone-500 group-open:hidden">Show</span>
        <span className="hidden text-xs text-stone-500 group-open:inline">Hide</span>
      </summary>

      <div className="flex flex-col gap-4 border-t border-stone-200 px-4 py-3">
        <p className="text-sm text-stone-600">
          Every save is kept as a version with its date and time, so you can always go back.
          We recommend keeping all versions: they stay on this device and take little space
          ({formatBytes(totalBytes)} so far).
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <Field label="Name this version (optional)" htmlFor={`${id}-note`} className="min-w-48 flex-1">
            <input
              id={`${id}-note`}
              className={controlClass}
              value={note}
              maxLength={200}
              dir="auto"
              placeholder="e.g. Sent to Larkspur Labs"
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void saveNamed();
              }}
            />
          </Field>
          <Button variant="primary" onClick={() => void saveNamed()}>
            Save version
          </Button>
        </div>

        <Field
          label="How many versions to keep"
          htmlFor={`${id}-retention`}
          hint={
            retention === 'all'
              ? 'Nothing is ever deleted automatically.'
              : `Older autosaves beyond ${retention} are deleted. Named versions are always kept.`
          }
          className="max-w-xs"
        >
          <select
            id={`${id}-retention`}
            className={controlClass}
            value={String(retention)}
            onChange={(e) => void setRetention(parseRetention(e.target.value))}
          >
            {RETENTION_OPTIONS.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        {versions.length === 0 ? (
          <p className="text-sm text-stone-500">No versions yet. Your first save creates one.</p>
        ) : (
          <ol aria-label="Versions, newest first">
            {shown.map((version) => (
              <VersionRow
                key={version.id}
                version={version}
                isLatest={version.id === latest?.id}
                now={now}
                onRestore={() => setPendingRestore(version)}
                onDownload={() => void download(version)}
              />
            ))}
          </ol>
        )}

        {versions.length > INITIAL_ROWS ? (
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show fewer' : `Show all ${versions.length} versions`}
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={pendingRestore !== null}
        title={`Restore version ${pendingRestore?.number ?? ''}?`}
        description={`The resume will go back to how it was on ${
          pendingRestore ? formatDateTime(pendingRestore.savedAt) : ''
        }. Your current state is already saved as version ${latest?.number ?? ''}, so you can return to it at any time.`}
        confirmLabel="Restore"
        tone="primary"
        onCancel={() => setPendingRestore(null)}
        onConfirm={() => {
          const target = pendingRestore;
          setPendingRestore(null);
          if (!target) return;
          void restoreVersion(target.id).then((version) => {
            if (version) {
              toast.success(`Version ${target.number} restored`, `Saved as version ${version.number}.`);
            }
          });
        }}
      />
    </details>
  );
}
