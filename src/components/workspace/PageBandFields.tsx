import { useId, useRef } from 'react';

import { Field, controlClass } from '@/components/ui/field';
import { HORIZONTAL_ALIGNS, LIMITS, PAGE_BAND_TOKENS, type HorizontalAlign } from '@/config/layout';
import { useT, type MessageKey } from '@/i18n';
import { newPageBand, type PageBandKind } from '@/lib/page-bands';
import type { PageBand } from '@/schema/resume';

interface PageBandFieldsProps {
  readonly kind: PageBandKind;
  readonly band: PageBand | undefined;
  readonly onChange: (band: PageBand) => void;
}

const LABELS: Record<PageBandKind, MessageKey> = {
  header: 'page.header',
  footer: 'page.footer',
};

const ALIGN_LABELS: Record<HorizontalAlign, MessageKey> = {
  start: 'tb.start',
  center: 'tb.centre',
  end: 'tb.end',
};

function isHorizontalAlign(value: string): value is HorizontalAlign {
  return (HORIZONTAL_ALIGNS as readonly string[]).includes(value);
}

/** Switch a page header or footer on and edit its text, alignment and first-page rule. */
export function PageBandFields({ kind, band, onChange }: PageBandFieldsProps) {
  const t = useT();
  const id = useId();
  const textRef = useRef<HTMLInputElement>(null);
  const current = band ?? { ...newPageBand(), enabled: false };

  const insert = (token: string) => {
    const input = textRef.current;
    const start = input?.selectionStart ?? current.text.length;
    const end = input?.selectionEnd ?? current.text.length;
    const text = (current.text.slice(0, start) + token + current.text.slice(end)).slice(
      0,
      LIMITS.pageBandText,
    );
    onChange({ ...current, text });
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <div className="col-span-full flex flex-col gap-2 rounded-md border border-stone-200 p-3">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          className="accent-brand size-4"
          checked={current.enabled}
          onChange={(e) => onChange({ ...current, enabled: e.target.checked })}
        />
        {t(LABELS[kind])}
      </label>

      {current.enabled ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field
            label={t('page.bandText')}
            htmlFor={`${id}-text`}
            hint={t('page.bandHint')}
            className="col-span-full"
          >
            <input
              ref={textRef}
              id={`${id}-text`}
              className={controlClass}
              value={current.text}
              maxLength={LIMITS.pageBandText}
              onChange={(e) => onChange({ ...current, text: e.target.value })}
            />
          </Field>
          <div className="col-span-full flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-stone-300 px-2 py-1 text-xs hover:bg-stone-100"
              onClick={() => insert(PAGE_BAND_TOKENS.page)}
            >
              {t('page.insertPage')}
            </button>
            <button
              type="button"
              className="rounded-md border border-stone-300 px-2 py-1 text-xs hover:bg-stone-100"
              onClick={() => insert(PAGE_BAND_TOKENS.pages)}
            >
              {t('page.insertPages')}
            </button>
          </div>
          <Field label={t('page.bandAlign')} htmlFor={`${id}-align`}>
            <select
              id={`${id}-align`}
              className={controlClass}
              value={current.align}
              onChange={(e) =>
                isHorizontalAlign(e.target.value) && onChange({ ...current, align: e.target.value })
              }
            >
              {HORIZONTAL_ALIGNS.map((align) => (
                <option key={align} value={align}>
                  {t(ALIGN_LABELS[align])}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              className="accent-brand size-4"
              checked={current.firstPage}
              onChange={(e) => onChange({ ...current, firstPage: e.target.checked })}
            />
            {t('page.bandFirstPage')}
          </label>
        </div>
      ) : null}
    </div>
  );
}
