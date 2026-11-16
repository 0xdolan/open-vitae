import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { PlusIcon, TrashIcon } from '@/components/ui/icons';
import { fontStack } from '@/config/fonts';
import { formatBytes } from '@/lib/format';
import { FORMAT_LABELS } from '@/lib/fonts/registrar';
import { useT } from '@/i18n';
import { FontFileError, toast, useFontStore } from '@/stores';

import { GoogleConsent } from './GoogleConsent';

/** Your own fonts and the Google Fonts setting, shown under Page setup. */
export function FontsManager() {
  const t = useT();
  const userFonts = useFontStore((s) => s.userFonts);
  const googleConsent = useFontStore((s) => s.googleConsent);
  const googleFamilies = useFontStore((s) => s.googleFamilies);
  const bundledLoaded = useFontStore((s) => s.bundledLoaded);
  const addUserFont = useFontStore((s) => s.addUserFont);
  const renameUserFont = useFontStore((s) => s.renameUserFont);
  const removeUserFont = useFontStore((s) => s.removeUserFont);
  const setGoogleConsent = useFontStore((s) => s.setGoogleConsent);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    for (const file of files) {
      try {
        const font = await addUserFont(file);
        toast.success(t('fonts.added'), t('fonts.addedBody', { name: font.family }));
      } catch (error) {
        toast.error(
          t('fonts.notAdded', { file: file.name }),
          error instanceof FontFileError ? error.message : t('fonts.unreadable'),
        );
      }
    }
    setBusy(false);
  };

  return (
    <section
      aria-labelledby="fonts-heading"
      className="flex flex-col gap-4 border-t border-stone-200 pt-5"
    >
      <h3 id="fonts-heading" className="font-semibold">
        {t('fonts.title')}
      </h3>

      {bundledLoaded.length < 2 ? (
        <p className="rounded-md bg-stone-100 p-2.5 text-xs text-stone-600">
          {t('fonts.bundledMissing')} <code dir="ltr">npm run fonts:fetch</code>
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">{t('fonts.yours')}</p>
          <Button size="sm" onClick={() => input.current?.click()} disabled={busy}>
            <PlusIcon /> {busy ? t('fonts.adding') : t('fonts.load')}
          </Button>
          <input
            ref={input}
            type="file"
            multiple
            accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
        <p className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-950">
          {t('fonts.privacy')}
        </p>
        {userFonts.length === 0 ? (
          <p className="text-sm text-stone-500">{t('fonts.none')}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {userFonts.map((font) => (
              <li
                key={font.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-stone-200 bg-card p-2"
              >
                <input
                  aria-label={t('fonts.nameOf', { file: font.fileName })}
                  className="h-8 min-w-32 flex-1 rounded border border-transparent px-1.5 hover:border-stone-300 focus-visible:border-brand"
                  defaultValue={font.family}
                  style={{ fontFamily: fontStack(font.family) }}
                  onBlur={(e) => void renameUserFont(font.id, e.target.value)}
                />
                <span className="text-xs text-stone-500">
                  {FORMAT_LABELS[font.format]} · {formatBytes(font.bytes)}
                </span>
                <Button
                  variant="danger-ghost"
                  size="sm"
                  aria-label={t('fonts.remove', { name: font.family })}
                  onClick={() => void removeUserFont(font.id)}
                >
                  <TrashIcon />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{t('fonts.google')}</p>
        {googleConsent ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-stone-600">
              {t('fonts.googleAllowed')}{' '}
              {googleFamilies.length > 0
                ? t('fonts.googleUsed', {
                    list: `${googleFamilies.slice(0, 6).join(', ')}${googleFamilies.length > 6 ? '…' : ''}`,
                  })
                : t('fonts.googlePick')}
            </p>
            <Button size="sm" variant="ghost" onClick={() => setGoogleConsent(false)}>
              {t('fonts.googleStop')}
            </Button>
          </div>
        ) : (
          <GoogleConsent />
        )}
      </div>
    </section>
  );
}
