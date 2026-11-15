import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CloseIcon, SearchIcon } from '@/components/ui/icons';
import {
  DEFAULT_ICON_SET,
  ICON_SET_IDS,
  ICON_SETS,
  isIconSetId,
  type IconSetId,
} from '@/config/icon-sets';
import { iconLabel, searchIcons } from '@/lib/icons/search';
import { cn } from '@/lib/utils';
import type { IconRef } from '@/schema/resume';

import { ResumeIcon, useIconSet } from './ResumeIcon';

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const setSelectId = useId();
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

  const choose = (icon: IconRef | undefined) => {
    onChange(icon);
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
            ? `Icon for ${target}: ${currentLabel}. Change icon`
            : `Add an icon to ${target}`
        }
        title={currentLabel ? `Icon: ${currentLabel}` : 'Add an icon'}
        onClick={() => setOpen(true)}
      >
        {value ? (
          <ResumeIcon icon={value} className="text-base" />
        ) : (
          <span aria-hidden="true">＋</span>
        )}
        <span>Icon</span>
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        className="m-auto w-[min(44rem,calc(100vw-1.5rem))] rounded-xl p-0 shadow-xl backdrop:bg-black/40"
      >
        {open ? (
          <div className="flex max-h-[min(40rem,calc(100dvh-2rem))] flex-col gap-3 p-4">
            <div className="flex items-center gap-2">
              <h2 id={titleId} className="text-base font-semibold">
                Icon for {target}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="ms-auto"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <CloseIcon />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="relative min-w-48 flex-1">
                <span className="sr-only">Search icons</span>
                <SearchIcon className="pointer-events-none absolute top-1/2 start-2.5 -translate-y-1/2 text-stone-400" />
                <input
                  ref={searchRef}
                  type="search"
                  className="h-9 w-full rounded-md border border-stone-300 ps-8 pe-2 text-sm"
                  placeholder="Search by name, e.g. email, map pin, github"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label htmlFor={setSelectId} className="sr-only">
                Icon set
              </label>
              <select
                id={setSelectId}
                className="h-9 rounded-md border border-stone-300 bg-white px-2 text-sm"
                value={setId}
                onChange={(e) => isIconSetId(e.target.value) && setSetId(e.target.value)}
              >
                {ICON_SET_IDS.map((id) => (
                  <option key={id} value={id}>
                    {ICON_SETS[id].label}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-stone-500" aria-live="polite">
              {results
                ? `${results.total} ${results.total === 1 ? 'icon' : 'icons'} in ${info.label}`
                : `Loading ${info.label}…`}
              {' · '}
              <a href={info.url} target="_blank" rel="noopener noreferrer" className="underline">
                {info.label}
              </a>
              , {info.license}
              {info.brands ? '. Logos are trademarks of their owners.' : '.'}
            </p>

            <div className="min-h-40 overflow-y-auto">
              {results && results.names.length === 0 ? (
                <p className="py-8 text-center text-sm text-stone-500">
                  No icons match “{deferredQuery}”. Try another word or set.
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
                          'flex w-full flex-col items-center gap-1 rounded-md border p-2 text-center hover:bg-stone-100',
                          selected ? 'border-brand bg-brand/10' : 'border-transparent',
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
                    Show more ({results.total - results.names.length} left)
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="flex justify-between gap-2 border-t border-stone-200 pt-3">
              <Button variant="danger-ghost" disabled={!value} onClick={() => choose(undefined)}>
                Remove icon
              </Button>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
