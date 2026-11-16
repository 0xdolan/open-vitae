import { useId } from 'react';

import { ColorControl, Field, controlClass } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { FontPicker } from '@/components/fonts/FontPicker';
import { DEFAULT_FONT_BY_DIRECTION, type TextDirection } from '@/config/fonts';
import { findResumeLanguage, RESUME_LANGUAGES } from '@/config/languages';
import {
  CONTACT_ICON_KINDS,
  DEFAULT_DESCRIPTION_LIMIT,
  DEFAULT_ICON_COLOR,
  DEFAULT_SUMMARY_LIMIT,
  LIMITS,
  PAGE_BREAK_MODES,
  type ContactIconKind,
  type PageBreakMode,
} from '@/config/layout';
import {
  describePageSize,
  isPageSizeId,
  PAGE_SIZE_GROUPS,
  PAGE_SIZES,
  type PageSizeGroup,
} from '@/config/page-sizes';
import { PageBandFields } from '@/components/workspace/PageBandFields';
import { isDigitSystem } from '@/lib/digits';
import { clamp } from '@/lib/format';
import type { ResumeLayout } from '@/schema/resume';
import { useT, type MessageKey } from '@/i18n';

interface PageSettingsProps {
  readonly layout: ResumeLayout;
  readonly onChange: (patch: Partial<ResumeLayout>) => void;
  /** BCP 47 tag of the resume content. */
  readonly language: string;
  readonly onLanguageChange: (language: string) => void;
}

const BREAK_LABELS: Record<PageBreakMode, MessageKey> = {
  smart: 'page.breaksSmart',
  manual: 'page.breaksManual',
};

const GROUP_LABELS: Record<PageSizeGroup, MessageKey> = {
  'International (ISO)': 'page.groupIso',
  'North American': 'page.groupUs',
  'Japanese (JIS)': 'page.groupJis',
};

const CONTACT_LABELS: Record<ContactIconKind, MessageKey> = {
  email: 'page.iconEmail',
  phone: 'page.iconPhone',
  location: 'page.iconLocation',
  website: 'page.iconWebsite',
};

function isPageBreakMode(value: string): value is PageBreakMode {
  return (PAGE_BREAK_MODES as readonly string[]).includes(value);
}

/** Parse a number input and keep it inside the allowed range. */
function readNumber(
  raw: string,
  limits: { readonly min: number; readonly max: number },
): number | null {
  const value = Number(raw);
  return raw === '' || Number.isNaN(value) ? null : clamp(value, limits.min, limits.max);
}

/** Divider with a heading between groups of settings. */
function Group({ title }: { readonly title: string }) {
  return (
    <h3 className="col-span-full mt-1 border-t border-stone-200 pt-3 text-xs font-semibold tracking-wide text-stone-500 uppercase">
      {title}
    </h3>
  );
}

interface LimitFieldProps {
  readonly id: string;
  readonly label: string;
  /** Stored value: absent means the default, null means no limit. */
  readonly value: number | null | undefined;
  readonly fallback: number;
  readonly onChange: (value: number | null) => void;
}

/** A soft character limit: a number, or "no limit". */
function LimitField({ id, label, value, fallback, onChange }: LimitFieldProps) {
  const t = useT();
  const unlimited = value === null;
  return (
    <Field label={label} htmlFor={id} hint={t('page.limitHint')}>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          className={controlClass}
          min={LIMITS.textLimit.min}
          max={LIMITS.textLimit.max}
          step={10}
          disabled={unlimited}
          value={unlimited ? '' : (value ?? fallback)}
          onChange={(e) => {
            const next = readNumber(e.target.value, LIMITS.textLimit);
            if (next !== null) onChange(Math.round(next));
          }}
        />
        <label className="flex shrink-0 items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            className="accent-brand size-4"
            checked={unlimited}
            onChange={(e) => onChange(e.target.checked ? null : fallback)}
          />
          {t('page.noLimit')}
        </label>
      </div>
    </Field>
  );
}

export function PageSettings({ layout, onChange, language, onLanguageChange }: PageSettingsProps) {
  const t = useT();
  const id = useId();
  const known = findResumeLanguage(language);
  const iconColor = layout.iconColor ?? DEFAULT_ICON_COLOR;

  const setDirection = (direction: TextDirection) => {
    const patch: Partial<ResumeLayout> = { direction };
    // Swap the default font along with the direction, but keep a font the person chose.
    if (layout.fontFamily === DEFAULT_FONT_BY_DIRECTION[layout.direction]) {
      patch.fontFamily = DEFAULT_FONT_BY_DIRECTION[direction];
    }
    onChange(patch);
  };

  const setContactColor = (kind: ContactIconKind, color: string | undefined) => {
    const next = Object.fromEntries(
      Object.entries({ ...layout.contactIconColors, [kind]: color }).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    );
    onChange({ contactIconColors: Object.keys(next).length > 0 ? next : undefined });
  };

  return (
    <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <legend className="sr-only">{t('page.settings')}</legend>

      <Field label={t('page.size')} htmlFor={`${id}-size`}>
        <Select
          id={`${id}-size`}
          value={layout.pageSize}
          onValueChange={(value) => isPageSizeId(value) && onChange({ pageSize: value })}
          contentClassName="min-w-64"
          items={PAGE_SIZE_GROUPS.map((group) => ({
            group: t(GROUP_LABELS[group]),
            options: PAGE_SIZES.filter((size) => size.group === group).map((size) => ({
              value: size.id,
              label: size.label,
              content: (
                <>
                  {size.label}
                  <span className="ms-2 text-xs text-stone-500">{describePageSize(size)}</span>
                </>
              ),
            })),
          }))}
        />
      </Field>

      <Field label={t('page.orientation')} htmlFor={`${id}-orientation`}>
        <Select
          id={`${id}-orientation`}
          value={layout.orientation}
          onValueChange={(value) =>
            onChange({ orientation: value === 'landscape' ? 'landscape' : 'portrait' })
          }
          items={[
            { value: 'portrait', label: t('page.portrait') },
            { value: 'landscape', label: t('page.landscape') },
          ]}
        />
      </Field>

      <Field label={t('page.direction')} htmlFor={`${id}-direction`}>
        <Select
          id={`${id}-direction`}
          value={layout.direction}
          onValueChange={(value) => setDirection(value === 'rtl' ? 'rtl' : 'ltr')}
          items={[
            { value: 'ltr', label: t('page.ltr') },
            { value: 'rtl', label: t('page.rtl') },
          ]}
        />
      </Field>

      <Field label={t('page.language')} htmlFor={`${id}-language`} hint={t('page.languageHint')}>
        <Select
          id={`${id}-language`}
          value={known?.tag ?? language}
          onValueChange={onLanguageChange}
          contentClassName="min-w-56"
          items={[
            ...(known ? [] : [{ value: language, label: language }]),
            ...RESUME_LANGUAGES.map((option) => ({
              value: option.tag,
              label:
                option.nativeName === option.label
                  ? option.label
                  : `${option.label} · ${option.nativeName}`,
            })),
          ]}
        />
      </Field>

      <Field label={t('page.font')} htmlFor={`${id}-font`}>
        <FontPicker
          id={`${id}-font`}
          value={layout.fontFamily}
          preferArabic={layout.direction === 'rtl'}
          onChange={(fontFamily) => onChange({ fontFamily })}
        />
      </Field>

      <Field label={t('page.breaks')} htmlFor={`${id}-breaks`}>
        <Select
          id={`${id}-breaks`}
          value={layout.pageBreaks}
          onValueChange={(value) => isPageBreakMode(value) && onChange({ pageBreaks: value })}
          items={PAGE_BREAK_MODES.map((mode) => ({ value: mode, label: t(BREAK_LABELS[mode]) }))}
        />
      </Field>

      <Field label={t('page.margin')} htmlFor={`${id}-margin`}>
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

      <Field label={t('page.textSize')} htmlFor={`${id}-size-pt`}>
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

      <Field label={t('page.lineHeight')} htmlFor={`${id}-line`}>
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

      <Field label={t('page.indent')} htmlFor={`${id}-indent`} hint={t('page.indentHint')}>
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

      <Field label={t('page.depth')} htmlFor={`${id}-depth`} hint={t('page.depthHint')}>
        <Select
          id={`${id}-depth`}
          value={layout.maxDepth === null ? 'unlimited' : String(layout.maxDepth)}
          onValueChange={(value) =>
            onChange({ maxDepth: value === 'unlimited' ? null : Number(value) })
          }
          items={[
            { value: 'unlimited', label: t('page.unlimited') },
            ...Array.from({ length: 9 }, (_, i) => ({
              value: String(i + 1),
              label: t('page.levels', { count: i + 1 }),
            })),
          ]}
        />
      </Field>

      <Field label={t('page.digits')} htmlFor={`${id}-digits`} hint={t('page.digitsHint')}>
        <Select
          id={`${id}-digits`}
          value={layout.digits ?? 'typed'}
          onValueChange={(value) => onChange({ digits: isDigitSystem(value) ? value : undefined })}
          items={[
            { value: 'typed', label: t('page.digitsAsTyped') },
            { value: 'latn', label: t('page.digitsLatn') },
            { value: 'arab', label: t('page.digitsArab') },
            { value: 'arabext', label: t('page.digitsArabext') },
          ]}
        />
      </Field>

      <Group title={t('page.colours')} />

      <Field label={t('page.accent')} htmlFor={`${id}-accent`}>
        <ColorControl
          id={`${id}-accent`}
          value={layout.accentColor}
          fallback="#000000"
          onChange={(accentColor) => accentColor && onChange({ accentColor })}
        />
      </Field>

      <Field label={t('page.sectionTitleColor')} htmlFor={`${id}-title-color`}>
        <ColorControl
          id={`${id}-title-color`}
          value={layout.sectionTitleColor}
          fallback={layout.accentColor}
          resetLabel={t('page.useAccent')}
          onChange={(sectionTitleColor) => onChange({ sectionTitleColor })}
        />
      </Field>

      <Field label={t('page.sectionRuleColor')} htmlFor={`${id}-rule-color`}>
        <ColorControl
          id={`${id}-rule-color`}
          value={layout.sectionRuleColor}
          fallback={layout.accentColor}
          resetLabel={t('page.useAccent')}
          onChange={(sectionRuleColor) => onChange({ sectionRuleColor })}
        />
      </Field>

      <label className="col-span-2 flex items-center gap-2 text-sm sm:col-span-3">
        <input
          type="checkbox"
          className="accent-brand size-4"
          checked={layout.sectionRule !== false}
          onChange={(e) => onChange({ sectionRule: e.target.checked ? undefined : false })}
        />
        {t('page.sectionRule')}
      </label>

      <Group title={t('page.icons')} />

      <Field
        label={t('page.iconColor')}
        htmlFor={`${id}-icon-color`}
        hint={t('page.iconColorHint')}
      >
        <ColorControl
          id={`${id}-icon-color`}
          value={layout.iconColor}
          fallback={DEFAULT_ICON_COLOR}
          resetLabel={t('page.resetColor')}
          onChange={(color) => onChange({ iconColor: color })}
        />
      </Field>

      <label className="col-span-2 flex items-center gap-2 self-start pt-6 text-sm sm:col-span-2">
        <input
          type="checkbox"
          className="accent-brand size-4"
          checked={layout.showContactIcons === true}
          onChange={(e) => onChange({ showContactIcons: e.target.checked })}
        />
        {t('page.contactIcons')}
      </label>

      {layout.showContactIcons === true
        ? CONTACT_ICON_KINDS.map((kind) => (
            <Field key={kind} label={t(CONTACT_LABELS[kind])} htmlFor={`${id}-icon-${kind}`}>
              <ColorControl
                id={`${id}-icon-${kind}`}
                value={layout.contactIconColors?.[kind]}
                fallback={iconColor}
                resetLabel={t('page.resetColor')}
                onChange={(color) => setContactColor(kind, color)}
              />
            </Field>
          ))
        : null}

      <Group title={t('page.lengthLimits')} />

      <LimitField
        id={`${id}-summary-limit`}
        label={t('page.summaryLimit')}
        value={layout.summaryLimit}
        fallback={DEFAULT_SUMMARY_LIMIT}
        onChange={(summaryLimit) => onChange({ summaryLimit })}
      />
      <LimitField
        id={`${id}-description-limit`}
        label={t('page.descriptionLimit')}
        value={layout.descriptionLimit}
        fallback={DEFAULT_DESCRIPTION_LIMIT}
        onChange={(descriptionLimit) => onChange({ descriptionLimit })}
      />

      <Group title={t('page.headerFooter')} />

      <PageBandFields
        kind="header"
        band={layout.header}
        onChange={(header) => onChange({ header })}
      />
      <PageBandFields
        kind="footer"
        band={layout.footer}
        onChange={(footer) => onChange({ footer })}
      />
    </fieldset>
  );
}
