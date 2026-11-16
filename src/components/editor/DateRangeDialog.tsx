import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { RESUME_LANGUAGES } from '@/config/languages';
import type { DigitSystem } from '@/config/layout';
import { useT, type MessageKey } from '@/i18n';
import {
  CALENDAR_IDS,
  formatRange,
  isCalendarId,
  monthNames,
  toCalendar,
  yearChoices,
  type CalendarId,
  type YearMonth,
} from '@/lib/calendars';
import { defaultDigits, toDigits } from '@/lib/digits';
import { useBackdropDismiss } from '@/hooks/useDismiss';

const CALENDAR_LABELS: Readonly<Record<CalendarId, MessageKey>> = {
  gregorian: 'dates.gregorian',
  persian: 'dates.persian',
  islamic: 'dates.islamic',
  kurdish: 'dates.kurdish',
};

const CALENDAR_KEY = 'open-vitae:date-calendar';

/** The calendar people in a language usually write resumes with. */
function defaultCalendar(language: string): CalendarId {
  try {
    const saved = localStorage.getItem(CALENDAR_KEY);
    if (saved && isCalendarId(saved)) return saved;
  } catch {
    // Preference only.
  }
  return language.startsWith('fa') ? 'persian' : 'gregorian';
}

interface DateRangeDialogProps {
  readonly open: boolean;
  /** The resume's language: month names and the word for "present". */
  readonly language: string;
  /** The resume's digit setting, if any. */
  readonly digits: DigitSystem | undefined;
  readonly onCancel: () => void;
  readonly onUse: (text: string) => void;
}

interface Picked {
  readonly year: number;
  /** 0 means no month. */
  readonly month: number;
}

/**
 * Writes a date range for the Dates field from pickers, in the Gregorian,
 * Persian, Islamic or Kurdish calendar. The result is ordinary text the person
 * can still edit; nothing about the calendar is stored.
 */
export function DateRangeDialog({
  open,
  language: resumeLanguage,
  digits,
  onCancel,
  onUse,
}: DateRangeDialogProps) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  const backdrop = useBackdropDismiss(() => {
    onCancel();
  });
  const titleId = useId();
  const id = useId();
  const [calendar, setCalendar] = useState<CalendarId>(() => defaultCalendar(resumeLanguage));
  const [language, setLanguage] = useState(resumeLanguage);
  const now = useMemo(() => toCalendar(new Date(), calendar), [calendar]);
  const [start, setStart] = useState<Picked>({ year: now.year - 2, month: 0 });
  const [end, setEnd] = useState<Picked>({ year: now.year, month: 0 });
  const [present, setPresent] = useState(true);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setLanguage(resumeLanguage);
    }
    if (!open && dialog.open) dialog.close();
  }, [open, resumeLanguage]);

  const chooseCalendar = (next: CalendarId) => {
    // Keep the same span of years when switching calendars.
    const shift = toCalendar(new Date(), next).year - toCalendar(new Date(), calendar).year;
    setCalendar(next);
    setStart((s) => ({ year: s.year + shift, month: 0 }));
    setEnd((e) => ({ year: e.year + shift, month: 0 }));
    try {
      localStorage.setItem(CALENDAR_KEY, next);
    } catch {
      // Preference only.
    }
  };

  const years = useMemo(() => yearChoices(calendar), [calendar]);
  const months = monthNames(calendar, language);
  const shownDigits = digits ?? defaultDigits(language);
  const toYearMonth = (p: Picked): YearMonth =>
    p.month ? { year: p.year, month: p.month } : { year: p.year };
  const text = formatRange(toYearMonth(start), present ? 'present' : toYearMonth(end), {
    calendar,
    language,
    digits: shownDigits,
  });

  const pickers = (
    which: 'start' | 'end',
    value: Picked,
    set: (p: Picked) => void,
    disabled = false,
  ) => (
    <div className="grid grid-cols-2 gap-2">
      <Field label={t('dates.month')} htmlFor={`${id}-${which}-month`}>
        <Select
          id={`${id}-${which}-month`}
          disabled={disabled}
          value={String(value.month)}
          onValueChange={(next) => set({ ...value, month: Number(next) })}
          items={[
            { value: '0', label: t('dates.noMonth') },
            ...months.map((name, index) => ({
              value: String(index + 1),
              label: name,
              lang: language,
            })),
          ]}
        />
      </Field>
      <Field label={t('dates.year')} htmlFor={`${id}-${which}-year`}>
        <Select
          id={`${id}-${which}-year`}
          disabled={disabled}
          value={String(value.year)}
          onValueChange={(next) => set({ ...value, year: Number(next) })}
          items={years.map((year) => ({
            value: String(year),
            label: toDigits(String(year), shownDigits),
          }))}
        />
      </Field>
    </div>
  );

  return (
    <dialog
      ref={ref}
      {...backdrop}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(30rem,calc(100vw-1.5rem))] bg-card text-foreground rounded-xl border border-stone-200 p-0 shadow-xl backdrop:bg-black/40"
    >
      {open ? (
        <form
          className="flex flex-col gap-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            onUse(text);
          }}
        >
          <h2 id={titleId} className="text-lg font-semibold">
            {t('dates.title')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('dates.calendar')} htmlFor={`${id}-calendar`}>
              <Select
                id={`${id}-calendar`}
                value={calendar}
                onValueChange={(next) => isCalendarId(next) && chooseCalendar(next)}
                items={CALENDAR_IDS.map((value) => ({
                  value,
                  label: t(CALENDAR_LABELS[value]),
                }))}
              />
            </Field>
            <Field label={t('dates.language')} htmlFor={`${id}-language`}>
              <Select
                id={`${id}-language`}
                value={language}
                onValueChange={setLanguage}
                items={[
                  ...RESUME_LANGUAGES.map((l) => ({
                    value: l.tag,
                    label: l.nativeName,
                    lang: l.tag,
                  })),
                  ...(RESUME_LANGUAGES.some((l) => l.tag === language)
                    ? []
                    : [{ value: language, label: language }]),
                ]}
              />
            </Field>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold">{t('dates.start')}</legend>
            {pickers('start', start, setStart)}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold">{t('dates.end')}</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-brand size-4"
                checked={present}
                onChange={(e) => setPresent(e.target.checked)}
              />
              {t('dates.present')}
            </label>
            {pickers('end', end, setEnd, present)}
          </fieldset>

          <div className="rounded-md bg-stone-100 p-3">
            <p className="text-xs text-stone-600">{t('dates.preview')}</p>
            <output
              className="mt-1 block text-base font-medium"
              dir="auto"
              lang={language}
              aria-live="polite"
            >
              {text}
            </output>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={onCancel}>{t('dates.cancel')}</Button>
            <Button type="submit" variant="primary">
              {t('dates.use')}
            </Button>
          </div>
        </form>
      ) : null}
    </dialog>
  );
}
