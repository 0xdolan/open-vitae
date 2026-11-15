import { useEffect, useMemo, useState } from 'react';

import { fontsUsedBy } from '@/lib/fonts/usage';
import type { ResumeDocument } from '@/schema/resume';
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
      <p className="font-semibold">Some fonts in this resume are not available in this browser</p>
      <ul className="mt-1 list-disc ps-5">
        {problems.map((p) => (
          <li key={p.family}>
            <strong dir="auto">{p.family}</strong>:{' '}
            {p.availability === 'needs-consent'
              ? 'a Google font; allow Google Fonts to use it.'
              : p.message}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs">A similar font is shown until then.</p>
      <button type="button" className="mt-2 text-sm font-semibold underline" onClick={onOpenFonts}>
        Open font settings
      </button>
    </div>
  );
}
