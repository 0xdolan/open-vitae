import { useId } from 'react';

import { Field, controlClass } from '@/components/ui/field';
import { FontPicker } from '@/components/fonts/FontPicker';
import { DEFAULT_FONT_BY_DIRECTION, type TextDirection } from '@/config/fonts';
import { findResumeLanguage, RESUME_LANGUAGES } from '@/config/languages';
import { LIMITS, PAGE_BREAK_MODES, type PageBreakMode } from '@/config/layout';
import { describePageSize, isPageSizeId, PAGE_SIZE_GROUPS, PAGE_SIZES } from '@/config/page-sizes';
import { clamp } from '@/lib/format';
import type { ResumeLayout } from '@/schema/resume';

interface PageSettingsProps {
  readonly layout: ResumeLayout;
  readonly onChange: (patch: Partial<ResumeLayout>) => void;
  /** BCP 47 tag of the resume content. */
  readonly language: string;
  readonly onLanguageChange: (language: string) => void;
}

const BREAK_LABELS: Record<PageBreakMode, string> = {
  smart: 'Smart (automatic)',
  manual: 'Manual',
};

function isPageBreakMode(value: string): value is PageBreakMode {
  return (PAGE_BREAK_MODES as readonly string[]).includes(value);
}

/** Parse a number input and keep it inside the allowed range. */
function readNumber(raw: string, limits: { readonly min: number; readonly max: number }): number | null {
  const value = Number(raw);
  return raw === '' || Number.isNaN(value) ? null : clamp(value, limits.min, limits.max);
}

export function PageSettings({ layout, onChange, language, onLanguageChange }: PageSettingsProps) {
  const id = useId();

  const setDirection = (direction: TextDirection) => {
    const patch: Partial<ResumeLayout> = { direction };
    // Swap the default font along with the direction, but keep a font the person chose.
    if (layout.fontFamily === DEFAULT_FONT_BY_DIRECTION[layout.direction]) {
      patch.fontFamily = DEFAULT_FONT_BY_DIRECTION[direction];
    }
    onChange(patch);
  };

  return (
    <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <legend className="sr-only">Page settings</legend>

      <Field label="Page size" htmlFor={`${id}-size`}>
        <select
          id={`${id}-size`}
          className={controlClass}
          value={layout.pageSize}
          onChange={(e) => isPageSizeId(e.target.value) && onChange({ pageSize: e.target.value })}
        >
          {PAGE_SIZE_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {PAGE_SIZES.filter((size) => size.group === group).map((size) => (
                <option key={size.id} value={size.id}>
                  {size.label} · {describePageSize(size)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      <Field label="Orientation" htmlFor={`${id}-orientation`}>
        <select
          id={`${id}-orientation`}
          className={controlClass}
          value={layout.orientation}
          onChange={(e) =>
            onChange({ orientation: e.target.value === 'landscape' ? 'landscape' : 'portrait' })
          }
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </Field>

      <Field label="Direction" htmlFor={`${id}-direction`}>
        <select
          id={`${id}-direction`}
          className={controlClass}
          value={layout.direction}
          onChange={(e) => setDirection(e.target.value === 'rtl' ? 'rtl' : 'ltr')}
        >
          <option value="ltr">Left to right</option>
          <option value="rtl">Right to left</option>
        </select>
      </Field>

      <Field label="Language" htmlFor={`${id}-language`} hint="Sets section titles, spelling and direction.">
        <select
          id={`${id}-language`}
          className={controlClass}
          value={findResumeLanguage(language)?.tag ?? language}
          onChange={(e) => onLanguageChange(e.target.value)}
        >
          {findResumeLanguage(language) ? null : <option value={language}>{language}</option>}
          {RESUME_LANGUAGES.map((option) => (
            <option key={option.tag} value={option.tag}>
              {option.label}
              {option.nativeName === option.label ? '' : ` · ${option.nativeName}`}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Font" htmlFor={`${id}-font`}>
        <FontPicker
          id={`${id}-font`}
          value={layout.fontFamily}
          preferArabic={layout.direction === 'rtl'}
          onChange={(fontFamily) => onChange({ fontFamily })}
        />
      </Field>

      <Field label="Page breaks" htmlFor={`${id}-breaks`}>
        <select
          id={`${id}-breaks`}
          className={controlClass}
          value={layout.pageBreaks}
          onChange={(e) => isPageBreakMode(e.target.value) && onChange({ pageBreaks: e.target.value })}
        >
          {PAGE_BREAK_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {BREAK_LABELS[mode]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Margin (mm)" htmlFor={`${id}-margin`}>
        <input
          id={`${id}-margin`}
          type="number"
          inputMode="decimal"
          className={controlClass}
          min={LIMITS.marginMm.min}
          max={LIMITS.marginMm.max}
          step={1}
          value={layout.marginMm}
          onChange={(e) => {
            const value = readNumber(e.target.value, LIMITS.marginMm);
            if (value !== null) onChange({ marginMm: value });
          }}
        />
      </Field>

      <Field label="Text size (pt)" htmlFor={`${id}-size-pt`}>
        <input
          id={`${id}-size-pt`}
          type="number"
          inputMode="decimal"
          className={controlClass}
          min={LIMITS.baseFontSizePt.min}
          max={LIMITS.baseFontSizePt.max}
          step={0.5}
          value={layout.baseFontSizePt}
          onChange={(e) => {
            const value = readNumber(e.target.value, LIMITS.baseFontSizePt);
            if (value !== null) onChange({ baseFontSizePt: value });
          }}
        />
      </Field>

      <Field label="Line height" htmlFor={`${id}-line`}>
        <input
          id={`${id}-line`}
          type="number"
          inputMode="decimal"
          className={controlClass}
          min={LIMITS.lineHeight.min}
          max={LIMITS.lineHeight.max}
          step={0.05}
          value={layout.lineHeight}
          onChange={(e) => {
            const value = readNumber(e.target.value, LIMITS.lineHeight);
            if (value !== null) onChange({ lineHeight: value });
          }}
        />
      </Field>

      <Field label="Indent size (spaces)" htmlFor={`${id}-indent`} hint="For lists and indented paragraphs.">
        <input
          id={`${id}-indent`}
          type="number"
          inputMode="numeric"
          className={controlClass}
          min={LIMITS.indentCh.min}
          max={LIMITS.indentCh.max}
          step={1}
          value={layout.indentCh}
          onChange={(e) => {
            const value = readNumber(e.target.value, LIMITS.indentCh);
            if (value !== null) onChange({ indentCh: Math.round(value) });
          }}
        />
      </Field>

      <Field label="Nesting levels" htmlFor={`${id}-depth`} hint="How deep lists and indents may go.">
        <select
          id={`${id}-depth`}
          className={controlClass}
          value={layout.maxDepth === null ? 'unlimited' : String(layout.maxDepth)}
          onChange={(e) => onChange({ maxDepth: e.target.value === 'unlimited' ? null : Number(e.target.value) })}
        >
          <option value="unlimited">Unlimited</option>
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'level' : 'levels'}
            </option>
          ))}
        </select>
      </Field>

      <label className="col-span-2 flex items-center gap-2 self-end pb-2 text-sm sm:col-span-1">
        <input
          type="checkbox"
          className="accent-brand size-4"
          checked={layout.showContactIcons === true}
          onChange={(e) => onChange({ showContactIcons: e.target.checked })}
        />
        Icons in the contact line
      </label>

      <Field label="Accent colour" htmlFor={`${id}-accent`}>
        <input
          id={`${id}-accent`}
          type="color"
          className="h-9 w-full cursor-pointer rounded-md border border-stone-300 bg-white p-1"
          value={/^#[0-9a-f]{6}$/i.test(layout.accentColor) ? layout.accentColor : '#000000'}
          onChange={(e) => onChange({ accentColor: e.target.value })}
        />
      </Field>
    </fieldset>
  );
}
