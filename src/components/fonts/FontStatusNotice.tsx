import { useEffect, useMemo, useState } from 'react';

import { fontsUsedBy } from '@/lib/fonts/usage';
import type { ResumeDocument } from '@/schema/resume';
import { useT } from '@/i18n';
import { useFontStore, type FontStatus } from '@/stores';

/**
 * Loads the fonts a resume needs and says plainly when one is not available
 * here, for example a font loaded in another browser or before a cache clear.
 */
export function FontStatusNotice({
  doc,
  onOpenFonts,
}: {
  readonly doc: ResumeDocument;
  readonly onOpenFonts: () => void;
}) {
  const t = useT();
  const ready = useFontStore((s) => s.ready);
  const ensureFonts = useFontStore((s) => s.ensureFonts);
  const userFonts = useFontStore((s) => s.userFonts);
  const googleConsent = useFontStore((s) => s.googleConsent);
  const googleState = useFontStore((s) => s.googleState);
  const families = useMemo(() => fontsUsedBy(doc), [doc]);
  const key = families.join('|');
  const [statuses, setStatuses] = useState<FontStatus[]>([]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void ensureFonts(families).then((result) => {
      if (!cancelled) setStatuses(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key stands for families
  }, [ready, key, ensureFonts, userFonts, googleConsent, googleState]);

  const statusText = (status: FontStatus): string | undefined => {
    if (status.availability === 'needs-consent') return t('fonts.needsConsent');
    if (status.availability === 'missing' && status.kind === 'bundled')
      return t('fonts.bundledNotInstalled');
    if (status.availability === 'missing' && status.kind === 'user')
      return t('fonts.userNotLoaded');
    return status.message;
  };

  const problems = statuses.filter(
    (s) =>
      s.availability === 'missing' ||
      s.availability === 'needs-consent' ||
      s.availability === 'error',
  );
  if (problems.length === 0) return null;

  return (
    <div
      role="status"
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p className="font-semibold">{t('fonts.missingTitle')}</p>
      <ul className="mt-1 list-disc ps-5">
        {problems.map((p) => (
          <li key={p.family}>
            <strong dir="auto">{p.family}</strong>: {statusText(p)}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs">{t('fonts.fallback')}</p>
      <button type="button" className="mt-2 text-sm font-semibold underline" onClick={onOpenFonts}>
        {t('fonts.openSettings')}
      </button>
    </div>
  );
}
