import { useId, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Field, controlClass } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
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
    <div className="col-span-full flex flex-col gap-2">
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
            <Button size="sm" onClick={() => insert(PAGE_BAND_TOKENS.page)}>
              {t('page.insertPage')}
            </Button>
            <Button size="sm" onClick={() => insert(PAGE_BAND_TOKENS.pages)}>
              {t('page.insertPages')}
            </Button>
          </div>
          <Field label={t('page.bandAlign')} htmlFor={`${id}-align`}>
            <Select
              id={`${id}-align`}
              value={current.align}
              onValueChange={(value) =>
                isHorizontalAlign(value) && onChange({ ...current, align: value })
              }
              items={HORIZONTAL_ALIGNS.map((align) => ({
                value: align,
                label: t(ALIGN_LABELS[align]),
              }))}
            />
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
