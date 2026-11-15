import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { PlusIcon, TrashIcon } from '@/components/ui/icons';
import { fontStack } from '@/config/fonts';
import { formatBytes } from '@/lib/format';
import { FORMAT_LABELS } from '@/lib/fonts/registrar';
import { FontFileError, toast, useFontStore } from '@/stores';

import { GoogleConsent } from './GoogleConsent';

/** Your own fonts and the Google Fonts setting, shown under Page setup. */
export function FontsManager() {
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
        toast.success('Font added', `“${font.family}” is ready to use in this browser.`);
      } catch (error) {
        toast.error(
          `${file.name} was not added`,
          error instanceof FontFileError ? error.message : 'The file could not be read.',
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
        Fonts
      </h3>

      {bundledLoaded.length < 2 ? (
        <p className="rounded-md bg-stone-100 p-2.5 text-xs text-stone-600">
          The bundled Persian and Arabic fonts (Sahel, Estedad) are not installed in this copy of
          the app, so a similar system font is used. Whoever runs the app can add them with{' '}
          <code>npm run fonts:fetch</code>.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Your fonts</p>
          <Button size="sm" onClick={() => input.current?.click()} disabled={busy}>
            <PlusIcon /> {busy ? 'Adding…' : 'Load a font file'}
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
          Fonts you load stay in this browser only and are never uploaded. They are kept until you
          clear this site’s data or your browser cache; after that, load them again. Open Vitae
          collects nothing, so it cannot restore them for you. Only load fonts you are allowed to
          use.
        </p>
        {userFonts.length === 0 ? (
          <p className="text-sm text-stone-500">
            No fonts loaded yet. TTF, OTF, WOFF and WOFF2 files work.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {userFonts.map((font) => (
              <li
                key={font.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-stone-200 bg-white p-2"
              >
                <input
                  aria-label={`Name of ${font.fileName}`}
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
                  aria-label={`Remove ${font.family}`}
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
        <p className="text-sm font-medium">Google Fonts</p>
        {googleConsent ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-stone-600">
              Allowed.{' '}
              {googleFamilies.length > 0
                ? `Used: ${googleFamilies.slice(0, 6).join(', ')}${googleFamilies.length > 6 ? '…' : ''}`
                : 'Pick one in the font menu.'}
            </p>
            <Button size="sm" variant="ghost" onClick={() => setGoogleConsent(false)}>
              Stop using Google Fonts
            </Button>
          </div>
        ) : (
          <GoogleConsent />
        )}
      </div>
    </section>
  );
}
