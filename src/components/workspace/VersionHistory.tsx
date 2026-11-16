import { useEffect, useId, useState } from 'react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { controlClass, Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { parseRetention, RETENTION_OPTIONS } from '@/config/versions';
import { formatDateTime, formatRelative } from '@/lib/datetime';
import { formatBytes } from '@/lib/format';
import type { VersionReason, VersionSummary } from '@/lib/versions/repository';
import { useT, type MessageKey } from '@/i18n';
import { toast, useResumeStore } from '@/stores';

const REASON_LABELS: Readonly<Record<VersionReason, MessageKey>> = {
  created: 'versions.created',
  autosave: 'versions.autosave',
  manual: 'versions.manual',
  restore: 'versions.restore',
  import: 'versions.import',
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
  const t = useT();
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-200 py-2.5 last:border-b-0">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">{t('versions.version', { number: version.number })}</span>
          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-700">
            {t(REASON_LABELS[version.reason])}
          </span>
          {isLatest ? (
            <span className="bg-brand-soft text-brand rounded px-1.5 py-0.5 text-xs font-medium">
              {t('versions.current')}
            </span>
          ) : null}
          {version.exportedAt ? (
            <span
              className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-800"
              title={t('versions.exportedAt', {
                when: formatDateTime(version.exportedAt, t.locale),
              })}
            >
              {t('versions.exported')}
            </span>
          ) : null}
        </p>
        {version.note ? (
          <p className="mt-0.5 text-sm text-stone-800" dir="auto">
            {version.note}
          </p>
        ) : null}
        <p className="mt-0.5 text-xs text-stone-600">
          <time dateTime={version.savedAt}>{formatDateTime(version.savedAt, t.locale)}</time>
          <span aria-hidden="true" className="text-stone-400">
            {' '}
            ·{' '}
          </span>
          {formatRelative(version.savedAt, now, t.locale)}
          <span aria-hidden="true" className="text-stone-400">
            {' '}
            ·{' '}
          </span>
          {formatBytes(version.bytes)}
        </p>
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onDownload}
          aria-label={t('versions.downloadLabel', { number: version.number })}
        >
          {t('versions.download')}
        </Button>
        {!isLatest ? (
          <Button
            size="sm"
            onClick={onRestore}
            aria-label={t('versions.restoreLabel', { number: version.number })}
          >
            {t('versions.restoreButton')}
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
  const t = useT();
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
      toast.success(
        t('versions.saved', { number: version.number }),
        formatDateTime(version.savedAt, t.locale),
      );
    }
  };

  const download = async (version: VersionSummary) => {
    const result = await exportJson(version.id);
    if (result) toast.success(t('export.done'), t('export.doneBody', { file: result.fileName }));
  };

  return (
    <details className="group rounded-xl border border-stone-200 bg-card" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3">
        <span className="font-semibold">
          {t('versions.title')}{' '}
          <span className="font-normal text-stone-500">({t.num(versions.length)})</span>
        </span>
        <span className="text-xs text-stone-500 group-open:hidden">{t('versions.show')}</span>
        <span className="hidden text-xs text-stone-500 group-open:inline">
          {t('versions.hide')}
        </span>
      </summary>

      <div className="flex flex-col gap-4 border-t border-stone-200 px-4 py-3">
        <p className="text-sm text-stone-600">
          {t('versions.intro', { size: formatBytes(totalBytes) })}
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <Field label={t('versions.name')} htmlFor={`${id}-note`} className="min-w-48 flex-1">
            <input
              id={`${id}-note`}
              className={controlClass}
              value={note}
              maxLength={200}
              dir="auto"
              placeholder={t('versions.namePlaceholder')}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void saveNamed();
              }}
            />
          </Field>
          <Button variant="primary" onClick={() => void saveNamed()}>
            {t('versions.save')}
          </Button>
        </div>

        <Field
          label={t('versions.keep')}
          htmlFor={`${id}-retention`}
          hint={
            retention === 'all'
              ? t('versions.keepAllHint')
              : t('versions.keepSomeHint', { count: retention })
          }
          className="max-w-xs"
        >
          <Select
            id={`${id}-retention`}
            value={String(retention)}
            onValueChange={(value) => void setRetention(parseRetention(value))}
            items={RETENTION_OPTIONS.map((option) => ({
              value: String(option.value),
              label:
                option.value === 'all'
                  ? t('versions.retainAll')
                  : t('versions.retainLatest', { count: option.value }),
            }))}
          />
        </Field>

        {versions.length === 0 ? (
          <p className="text-sm text-stone-500">{t('versions.none')}</p>
        ) : (
          <ol aria-label={t('versions.list')}>
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
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? t('versions.showFewer') : t('versions.showAll', { count: versions.length })}
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={pendingRestore !== null}
        title={t('versions.restoreTitle', { number: pendingRestore?.number ?? '' })}
        description={t('versions.restoreBody', {
          when: pendingRestore ? formatDateTime(pendingRestore.savedAt, t.locale) : '',
          current: latest?.number ?? '',
        })}
        confirmLabel={t('versions.restoreButton')}
        tone="primary"
        onCancel={() => setPendingRestore(null)}
        onConfirm={() => {
          const target = pendingRestore;
          setPendingRestore(null);
          if (!target) return;
          void restoreVersion(target.id).then((version) => {
            if (version) {
              toast.success(
                t('versions.restored', { number: target.number }),
                t('versions.restoredBody', { number: version.number }),
              );
            }
          });
        }}
      />
    </details>
  );
}
