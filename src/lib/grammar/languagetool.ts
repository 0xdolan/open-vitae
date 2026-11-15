import { z } from 'zod';

/**
 * A small client for a self-hosted LanguageTool server (POST /v2/check).
 * Only same-origin endpoints are allowed: the Content Security Policy blocks
 * anything else, and resume text must never leave for a third party unasked.
 */

export const DEFAULT_GRAMMAR_ENDPOINT = '/languagetool/v2/check';

/** Longest text sent in one request; LanguageTool's own default limit is far higher. */
export const MAX_CHECK_LENGTH = 60_000;

export class GrammarError extends Error {
  override readonly name = 'GrammarError';
}

const matchSchema = z.object({
  message: z.string().max(2000),
  shortMessage: z.string().max(500).optional(),
  offset: z.number().int().nonnegative(),
  length: z.number().int().nonnegative(),
  replacements: z
    .array(z.object({ value: z.string().max(500) }))
    .max(50)
    .default([]),
  rule: z
    .object({
      id: z.string().max(200),
      description: z.string().max(500).optional(),
      issueType: z.string().max(100).optional(),
      category: z
        .object({ id: z.string().max(200).optional(), name: z.string().max(200).optional() })
        .optional(),
    })
    .optional(),
});

const responseSchema = z.object({
  language: z
    .object({ code: z.string().max(40).optional(), name: z.string().max(100).optional() })
    .optional(),
  matches: z.array(matchSchema).max(5000),
});

export type GrammarMatch = z.infer<typeof matchSchema>;

/**
 * The endpoint as a URL on this site, or null when it points anywhere else:
 * "/languagetool/v2/check" is fine, "https://api.example.com/v2/check" and
 * "//example.com/check" are not.
 */
export function sameOriginEndpoint(endpoint: string, origin: string): URL | null {
  const trimmed = endpoint.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) return null;
  try {
    const url = new URL(trimmed, origin);
    return url.origin === new URL(origin).origin ? url : null;
  } catch {
    return null;
  }
}

/** Languages LanguageTool checks, keyed by the resume's base language. Sorani is not one of them. */
const LANGUAGES: Readonly<Record<string, string>> = {
  en: 'en-US',
  fa: 'fa',
  ar: 'ar',
  de: 'de-DE',
  fr: 'fr',
  es: 'es',
  pt: 'pt-PT',
  nl: 'nl',
  it: 'it',
  pl: 'pl-PL',
  ru: 'ru-RU',
  uk: 'uk-UA',
  sv: 'sv',
  da: 'da-DK',
  ca: 'ca-ES',
  el: 'el-GR',
  ga: 'ga-IE',
  ja: 'ja-JP',
  zh: 'zh-CN',
  ta: 'ta-IN',
  tl: 'tl-PH',
  ro: 'ro-RO',
  sk: 'sk-SK',
  sl: 'sl-SI',
  be: 'be-BY',
  br: 'br-FR',
  eo: 'eo',
  gl: 'gl-ES',
  km: 'km-KH',
  ast: 'ast-ES',
};

/** LanguageTool's code for a resume language, or null when it is not supported. */
export function languageToolLanguage(tag: string): string | null {
  const parts = tag.split('-');
  const base = (parts[0] ?? '').toLowerCase();
  if (base === 'en' && parts[1]) {
    const region = parts[1].toUpperCase();
    if (['US', 'GB', 'AU', 'CA', 'NZ', 'ZA'].includes(region)) return `en-${region}`;
  }
  return LANGUAGES[base] ?? null;
}

interface CheckOptions {
  readonly endpoint: string;
  readonly text: string;
  readonly language: string;
  readonly origin: string;
  readonly signal?: AbortSignal;
  readonly fetchImpl?: typeof fetch;
}

/** Send text to the server and return what it found, sorted by position. */
export async function checkGrammar({
  endpoint,
  text,
  language,
  origin,
  signal,
  fetchImpl = fetch,
}: CheckOptions): Promise<GrammarMatch[]> {
  const url = sameOriginEndpoint(endpoint, origin);
  if (!url) throw new GrammarError('The server address must be a path on this site.');
  if (text.length > MAX_CHECK_LENGTH)
    throw new GrammarError('This resume is too long to check in one go.');

  const body = new URLSearchParams({ text, language });
  let response: Response;
  try {
    response = await fetchImpl(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new GrammarError('No answer from the server.');
  }
  if (!response.ok) throw new GrammarError(`The server answered with status ${response.status}.`);

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new GrammarError('The server’s answer was not understood.');
  }
  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) throw new GrammarError('The server’s answer was not understood.');
  return [...parsed.data.matches]
    .filter((m) => m.offset + m.length <= text.length)
    .sort((a, b) => a.offset - b.offset);
}
