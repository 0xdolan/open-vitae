import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { PanelHeading } from '@/components/editor/PanelHeading';
import { Button } from '@/components/ui/button';
import { controlClass, Field } from '@/components/ui/field';
import { findResumeLanguage } from '@/config/languages';
import { useT } from '@/i18n';
import {
  fieldText,
  grammarFields,
  joinFields,
  locate,
  replaceInField,
  setFieldValue,
  type GrammarField,
} from '@/lib/grammar/fields';
import {
  checkGrammar,
  DEFAULT_GRAMMAR_ENDPOINT,
  GrammarError,
  languageToolLanguage,
  sameOriginEndpoint,
  type GrammarMatch,
} from '@/lib/grammar/languagetool';
import type { ResumeDocument } from '@/schema/resume';
import { useResumeStore } from '@/stores';

const SETTINGS_KEY = 'open-vitae:grammar';

interface GrammarSettings {
  readonly enabled: boolean;
  readonly endpoint: string;
}

function readSettings(): GrammarSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<GrammarSettings>;
    return {
      enabled: raw.enabled === true,
      endpoint:
        typeof raw.endpoint === 'string' && raw.endpoint.length <= 200
          ? raw.endpoint
          : DEFAULT_GRAMMAR_ENDPOINT,
    };
  } catch {
    return { enabled: false, endpoint: DEFAULT_GRAMMAR_ENDPOINT };
  }
}

/** A finding tied to the field it is in, with the text it covers. */
interface Finding {
  readonly key: string;
  readonly field: GrammarField;
  readonly offset: number;
  readonly length: number;
  readonly found: string;
  readonly match: GrammarMatch;
}

/** A few words either side of the finding. */
function context(
  text: string,
  offset: number,
  length: number,
): { before: string; found: string; after: string } {
  const before = text.slice(Math.max(0, offset - 30), offset);
  const after = text.slice(offset + length, offset + length + 30);
  return {
    before: (offset > 30 ? '…' : '') + before,
    found: text.slice(offset, offset + length),
    after: after + (offset + length + 30 < text.length ? '…' : ''),
  };
}

/**
 * Optional grammar and spelling check with a LanguageTool server on this site
 * (the Docker Compose "grammar" profile runs one). Off until switched on; text
 * goes only to the address set here, which must be on the same site.
 */
export function GrammarPanel({ doc }: { readonly doc: ResumeDocument }) {
  const t = useT();
  const id = useId();
  const updateActive = useResumeStore((s) => s.updateActive);
  const [settings, setSettings] = useState<GrammarSettings>(readSettings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [ignored, setIgnored] = useState<ReadonlySet<string>>(new Set());
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Preference only.
    }
  }, [settings]);

  useEffect(() => () => abort.current?.abort(), []);

  const language = languageToolLanguage(doc.language);
  const languageName = findResumeLanguage(doc.language)?.nativeName ?? doc.language;
  const endpointValid = sameOriginEndpoint(settings.endpoint, window.location.origin) !== null;

  const run = async () => {
    if (!language) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError(null);
    try {
      const fields = grammarFields(doc);
      const { text, spans } = joinFields(fields);
      const matches = await checkGrammar({
        endpoint: settings.endpoint,
        text,
        language,
        origin: window.location.origin,
        signal: controller.signal,
      });
      const next: Finding[] = [];
      for (const match of matches) {
        const place = locate(spans, match.offset, match.length);
        const field = place ? fields[place.field] : undefined;
        if (!place || !field) continue;
        next.push({
          key: `${field.id}:${place.offset}:${match.rule?.id ?? match.message}`,
          field,
          offset: place.offset,
          length: match.length,
          found: text.slice(match.offset, match.offset + match.length),
          match,
        });
      }
      setFindings(next);
      setIgnored(new Set());
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(
        t('grammar.failed', { reason: err instanceof GrammarError ? err.message : String(err) }),
      );
    } finally {
      if (abort.current === controller) setBusy(false);
    }
  };

  // A fix changes the text, so findings later in the same field move; drop that field's findings.
  const apply = (finding: Finding, replacement: string) => {
    const current = grammarFields(useResumeStore.getState().resumes[doc.id] ?? doc).find(
      (f) => f.id === finding.field.id,
    );
    if (
      !current ||
      fieldText(current).slice(finding.offset, finding.offset + finding.length) !== finding.found
    )
      return;
    const value = replaceInField(current, finding.offset, finding.length, replacement);
    if (value === null) return;
    updateActive((d) => setFieldValue(d, current, value));
    setFindings((list) => list?.filter((f) => f.field.id !== finding.field.id) ?? null);
  };

  const shown = useMemo(
    () => findings?.filter((f) => !ignored.has(f.key)) ?? [],
    [findings, ignored],
  );

  const fieldLabel = (field: GrammarField): string => {
    const target = field.target;
    if (target.type === 'profile')
      return t(target.key === 'headline' ? 'profile.headline' : 'profile.summary');
    const section = doc.sections.find((s) => s.id === target.sectionId);
    const sectionName = section?.title || t('section.untitled');
    if (target.type === 'section') return t('section.titleField');
    const item = section?.items.find((i) => i.id === target.itemId);
    return `${sectionName} › ${item?.title || t('entry.untitled')}`;
  };

  return (
    <section aria-labelledby={`${id}-heading`} className="flex flex-col gap-4">
      <PanelHeading
        id={`${id}-heading`}
        title={t('grammar.title')}
        description={t('grammar.description')}
      />

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          className="accent-brand size-4"
          checked={settings.enabled}
          onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
        />
        {t('grammar.enable')}
      </label>

      {!settings.enabled ? (
        <p className="rounded-md bg-stone-100 p-3 text-sm text-stone-600">{t('grammar.off')}</p>
      ) : (
        <>
          <Field
            label={t('grammar.endpoint')}
            htmlFor={`${id}-endpoint`}
            hint={t('grammar.endpointHint')}
          >
            <input
              id={`${id}-endpoint`}
              className={controlClass}
              dir="ltr"
              maxLength={200}
              aria-invalid={!endpointValid}
              value={settings.endpoint}
              onChange={(e) => setSettings((s) => ({ ...s, endpoint: e.target.value }))}
            />
          </Field>

          {language ? (
            <Button
              variant="primary"
              className="self-start"
              disabled={busy || !endpointValid}
              onClick={() => void run()}
            >
              {busy ? t('grammar.checking') : t('grammar.check')}
            </Button>
          ) : (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-950">
              {t('grammar.unsupported', { language: languageName })}
            </p>
          )}

          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {findings ? (
            <div aria-live="polite" className="flex flex-col gap-2">
              <p className="text-sm font-semibold">
                {shown.length === 0
                  ? t('grammar.none')
                  : t('grammar.count', { count: shown.length })}
              </p>
              <ul className="flex flex-col gap-2">
                {shown.map((finding) => {
                  const text = fieldText(finding.field);
                  const around = context(text, finding.offset, finding.length);
                  // Spans across formatting (part bold, part not) are fixed by hand.
                  const fixable =
                    replaceInField(finding.field, finding.offset, finding.length, '') !== null;
                  return (
                    <li
                      key={finding.key}
                      className="rounded-lg border border-stone-200 bg-white p-3 text-sm"
                    >
                      <p className="text-xs text-stone-500" dir="auto">
                        {t('grammar.where', { field: fieldLabel(finding.field) })}
                      </p>
                      <p className="mt-1" dir="auto" lang={doc.language}>
                        {around.before}
                        <mark className="rounded bg-amber-200 px-0.5">{around.found}</mark>
                        {around.after}
                      </p>
                      <p className="mt-1 text-stone-700" dir="auto">
                        {finding.match.message}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(fixable ? finding.match.replacements.slice(0, 4) : []).map((r) => (
                          <Button key={r.value} size="sm" onClick={() => apply(finding, r.value)}>
                            <span dir="auto" lang={doc.language}>
                              {t('grammar.apply', { text: r.value })}
                            </span>
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIgnored((s) => new Set(s).add(finding.key))}
                        >
                          {t('grammar.ignore')}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
