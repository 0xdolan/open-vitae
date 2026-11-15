import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { BUNDLED_FONTS, fontStack, SYSTEM_FONTS } from '@/config/fonts';
import { findGoogleFont, GOOGLE_FONTS, type FontCategory } from '@/config/google-fonts';
import { cleanFamilyName } from '@/lib/fonts/font-file';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import type { MessageKey } from '@/i18n/messages/en';
import { toast, useFontStore } from '@/stores';

import { GoogleConsent } from './GoogleConsent';

interface FontPickerProps {
  readonly id?: string;
  readonly value: string;
  readonly onChange: (family: string) => void;
  /** Show Arabic-script fonts first (for right-to-left resumes). */
  readonly preferArabic?: boolean;
}

const CATEGORY_LABELS: Readonly<Record<FontCategory, MessageKey>> = {
  'sans-serif': 'fonts.catSans',
  serif: 'fonts.catSerif',
  monospace: 'fonts.catMono',
  display: 'fonts.catDisplay',
  handwriting: 'fonts.catHandwriting',
};

type GroupId = 'bundled' | 'system' | 'user' | 'google';

interface Option {
  readonly family: string;
  readonly note?: string;
}

/**
 * Searchable font picker: bundled, system, your own and Google fonts. Each
 * name is shown in its own font once it is available. Any Google font can be
 * added by typing its exact name.
 */
export function FontPicker({ id, value, onChange, preferArabic = false }: FontPickerProps) {
  const t = useT();
  const autoId = useId();
  const buttonId = id ?? autoId;
  const listId = `${buttonId}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);

  const userFonts = useFontStore((s) => s.userFonts);
  const googleFamilies = useFontStore((s) => s.googleFamilies);
  const googleConsent = useFontStore((s) => s.googleConsent);
  const googleState = useFontStore((s) => s.googleState);
  const loadGoogleFont = useFontStore((s) => s.loadGoogleFont);

  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const onPointer = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const q = query.trim().toLowerCase();
  const match = (family: string) => q === '' || family.toLowerCase().includes(q);

  const groups = useMemo(() => {
    const google = [...GOOGLE_FONTS]
      .sort((a, b) => (preferArabic ? Number(Boolean(b.arabic)) - Number(Boolean(a.arabic)) : 0))
      .map(
        (g): Option => ({
          family: g.family,
          note: t(
            g.arabic
              ? 'fonts.noteArabic'
              : g.hebrew
                ? 'fonts.noteHebrew'
                : CATEGORY_LABELS[g.category],
          ),
        }),
      );
    const recent = googleFamilies
      .filter((f) => !findGoogleFont(f))
      .map((family): Option => ({ family, note: 'Google' }));
    return [
      {
        id: 'bundled' as GroupId,
        label: t('fonts.groupBundled'),
        options: BUNDLED_FONTS.map(
          (f): Option => ({
            family: f.family,
            note: f.arabicScript ? t('fonts.notePersianArabic') : undefined,
          }),
        ),
      },
      {
        id: 'system' as GroupId,
        label: t('fonts.groupSystem'),
        options: SYSTEM_FONTS.map((f): Option => ({ family: f.family })),
      },
      {
        id: 'user' as GroupId,
        label: t('fonts.groupUser'),
        options: userFonts.map((f): Option => ({ family: f.family, note: f.fileName })),
      },
      { id: 'google' as GroupId, label: t('fonts.google'), options: [...recent, ...google] },
    ]
      .map((g) => ({ ...g, options: g.options.filter((o) => match(o.family)) }))
      .filter((g) => g.options.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- match depends only on q
  }, [q, userFonts, googleFamilies, preferArabic, t]);

  const allFamilies = groups.flatMap((g) => g.options.map((o) => o.family.toLowerCase()));
  const typed = cleanFamilyName(query);
  const offerByName = typed !== null && !allFamilies.includes(typed.toLowerCase());

  const choose = async (family: string, isGoogle: boolean) => {
    if (isGoogle) {
      if (!googleConsent) return;
      try {
        await loadGoogleFont(family);
      } catch (error) {
        toast.error(t('fonts.notLoaded'), error instanceof Error ? error.message : undefined);
        return;
      }
    }
    onChange(family);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={root} className="relative">
      <button
        id={buttonId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-stone-300 bg-white px-2.5 text-start text-sm"
        style={{ fontFamily: fontStack(value) }}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{value}</span>
        <span aria-hidden="true" className="text-stone-400">
          ▾
        </span>
      </button>

      {open ? (
        <div
          className="absolute start-0 top-full z-40 mt-1 w-80 max-w-[90vw] rounded-lg border border-stone-200 bg-white p-2 shadow-xl"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              document.getElementById(buttonId)?.focus();
            }
          }}
        >
          <input
            ref={search}
            type="search"
            dir="auto"
            aria-label={t('fonts.search')}
            placeholder={t('fonts.searchPlaceholder')}
            className="mb-2 h-8 w-full rounded-md border border-stone-300 px-2 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div
            id={listId}
            role="listbox"
            aria-label={t('fonts.title')}
            className="max-h-72 overflow-auto"
          >
            {groups.map((group) => (
              <div key={group.id} role="group" aria-label={group.label} className="mb-2">
                <p className="px-2 py-1 text-xs font-semibold text-stone-500">{group.label}</p>
                {group.id === 'google' && !googleConsent ? <GoogleConsent compact /> : null}
                {group.options.map((option) => {
                  const google = group.id === 'google';
                  const state = googleState[option.family]?.state;
                  return (
                    <button
                      key={option.family}
                      type="button"
                      role="option"
                      aria-selected={option.family === value}
                      disabled={google && !googleConsent}
                      className={cn(
                        'flex w-full items-baseline justify-between gap-2 rounded px-2 py-1.5 text-start text-sm hover:bg-stone-100 disabled:opacity-50',
                        option.family === value && 'bg-brand-soft',
                      )}
                      style={
                        !google || state === 'ready'
                          ? { fontFamily: fontStack(option.family) }
                          : undefined
                      }
                      onClick={() => void choose(option.family, google)}
                    >
                      <span className="truncate">{option.family}</span>
                      <span className="shrink-0 font-sans text-xs text-stone-600">
                        {state === 'loading' ? t('fonts.loading') : option.note}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
            {offerByName && typed ? (
              <div className="border-t border-stone-200 pt-2">
                {googleConsent ? (
                  <button
                    type="button"
                    className="w-full rounded px-2 py-1.5 text-start text-sm hover:bg-stone-100"
                    onClick={() => void choose(typed, true)}
                  >
                    {t('fonts.loadByName', { name: typed })}
                  </button>
                ) : (
                  <p className="px-2 text-xs text-stone-500">
                    {t('fonts.allowToLoad', { name: typed })}
                  </p>
                )}
              </div>
            ) : null}
            {groups.length === 0 && !offerByName ? (
              <p className="px-2 py-3 text-sm text-stone-500">{t('fonts.noMatch')}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
