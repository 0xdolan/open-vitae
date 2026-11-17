import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ColorControl, controlClass } from '@/components/ui/field';
import { CloseIcon, SearchIcon } from '@/components/ui/icons';
import { Select } from '@/components/ui/select';
import {
  DEFAULT_ICON_SET,
  ICON_SET_IDS,
  ICON_SETS,
  isIconSetId,
  type IconSetId,
} from '@/config/icon-sets';
import { DEFAULT_ICON_COLOR } from '@/config/layout';
import { iconLabel, searchIcons } from '@/lib/icons/search';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import type { IconRef } from '@/schema/resume';

import { useIconSet } from '@/hooks/useIconSet';

import { ResumeIcon } from './ResumeIcon';
import { useBackdropDismiss } from '@/hooks/useDismiss';

interface IconPickerProps {
  readonly value: IconRef | undefined;
  readonly onChange: (icon: IconRef | undefined) => void;
  /** What the icon is for, e.g. "Experience", used in labels. */
  readonly target: string;
  readonly className?: string;
}

const PAGE = 120;

/**
 * A button showing the current icon; it opens a searchable icon chooser with
 * every Lucide and react-icons set. Sets load on demand.
 */
export function IconPicker({ value, onChange, target, className }: IconPickerProps) {
  const t = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdrop = useBackdropDismiss(() => {
    setOpen(false);
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const setSelectId = useId();
  const colorId = useId();
  const [open, setOpen] = useState(false);
  const [setId, setSetId] = useState<IconSetId>(
    value && isIconSetId(value.set) ? value.set : DEFAULT_ICON_SET,
  );
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const deferredQuery = useDeferredValue(query);
  const set = useIconSet(open ? setId : null);
  const info = ICON_SETS[setId];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      searchRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => setLimit(PAGE), [deferredQuery, setId]);

  const results = useMemo(
    () => (set ? searchIcons(set.names, deferredQuery, info.prefix, limit) : null),
    [set, deferredQuery, info.prefix, limit],
  );

  // A new icon keeps the colour chosen for the old one.
  const choose = (icon: IconRef | undefined) => {
    onChange(icon && value?.color ? { ...icon, color: value.color } : icon);
    setOpen(false);
  };

  const currentLabel =
    value && isIconSetId(value.set) ? iconLabel(value.name, ICON_SETS[value.set].prefix) : null;

  return (
    <>
      <Button
        size="sm"
        className={className}
        aria-label={
          currentLabel
            ? t('icons.change', { target, icon: currentLabel })
            : t('icons.add', { target })
        }
        title={currentLabel ? t('icons.current', { icon: currentLabel }) : t('icons.addShort')}
        onClick={() => setOpen(true)}
      >
        {value ? (
          <ResumeIcon icon={value} className="text-base" />
        ) : (
          <span aria-hidden="true">＋</span>
        )}
        <span>{t('icons.button')}</span>
      </Button>

      <dialog
        ref={dialogRef}
        {...backdrop}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        className="m-auto w-[min(44rem,calc(100vw-1.5rem))] bg-card text-foreground rounded-xl border border-stone-200 p-0 shadow-xl backdrop:bg-black/40"
      >
        {open ? (
          <div className="flex max-h-[min(40rem,calc(100dvh-2rem))] flex-col gap-3 p-4">
            <div className="flex items-center gap-2">
              <h2 id={titleId} className="text-base font-semibold">
                {t('icons.title', { target })}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="ms-auto"
                aria-label={t('icons.close')}
                onClick={() => setOpen(false)}
              >
                <CloseIcon />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="relative min-w-48 flex-1">
                <span className="sr-only">{t('icons.search')}</span>
                <SearchIcon className="pointer-events-none absolute top-1/2 start-2.5 -translate-y-1/2 text-stone-400" />
                <input
                  ref={searchRef}
                  type="search"
                  className={cn(controlClass, 'ps-8')}
                  placeholder={t('icons.searchPlaceholder')}
                  lang="en"
                  dir="ltr"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <Select
                id={setSelectId}
                aria-label={t('icons.set')}
                className="w-auto"
                value={setId}
                onValueChange={(next) => isIconSetId(next) && setSetId(next)}
                items={ICON_SET_IDS.map((id) => ({ value: id, label: ICON_SETS[id].label }))}
              />
            </div>

            <p className="text-xs text-stone-500" aria-live="polite">
              {t.locale !== 'en' ? `${t('icons.englishNames')} ` : null}
              {results
                ? t('icons.count', { count: results.total, set: info.label })
                : t('icons.loading', { set: info.label })}
              {' · '}
              <a href={info.url} target="_blank" rel="noopener noreferrer" className="underline">
                {info.label}
              </a>
              , {info.license}
              {info.brands ? `. ${t('icons.trademarks')}` : '.'}
            </p>

            <div className="min-h-40 overflow-y-auto">
              {results && results.names.length === 0 ? (
                <p className="py-8 text-center text-sm text-stone-500">
                  {t('icons.none', { query: deferredQuery })}
                </p>
              ) : null}
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-1.5">
                {results?.names.map((name) => {
                  const label = iconLabel(name, info.prefix);
                  const selected = value?.set === setId && value.name === name;
                  return (
                    <li key={name}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        title={label}
                        className={cn(
                          'flex w-full flex-col items-center gap-1 rounded-md border p-2 text-center',
                          selected
                            ? 'border-brand bg-selected text-selected-foreground'
                            : 'hover:bg-hover border-transparent',
                        )}
                        onClick={() => choose({ set: setId, name })}
                      >
                        <ResumeIcon icon={{ set: setId, name }} className="text-2xl" />
                        <span className="line-clamp-2 text-[0.65rem] leading-tight text-stone-600">
                          {label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {results && results.total > results.names.length ? (
                <div className="mt-3 flex justify-center">
                  <Button size="sm" onClick={() => setLimit((current) => current + PAGE)}>
                    {t('icons.more', { count: results.total - results.names.length })}
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-3">
              <Button variant="danger-ghost" disabled={!value} onClick={() => choose(undefined)}>
                {t('icons.remove')}
              </Button>
              {value ? (
                <div className="flex items-center gap-2 text-sm">
                  <label htmlFor={colorId}>{t('icons.color')}</label>
                  <div className="w-28">
                    <ColorControl
                      id={colorId}
                      value={value.color}
                      fallback={DEFAULT_ICON_COLOR}
                      resetLabel={t('icons.colorDefault')}
                      onChange={(color) => onChange({ set: value.set, name: value.name, color })}
                    />
                  </div>
                </div>
              ) : null}
              <Button onClick={() => setOpen(false)}>{t('icons.cancel')}</Button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
