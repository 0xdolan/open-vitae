import { describe, expect, it } from 'vitest';

import {
  checkGrammar,
  GrammarError,
  languageToolLanguage,
  sameOriginEndpoint,
} from './languagetool';

/** The value, or a test failure if it is missing. */
function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('Expected a value');
  return value;
}

const origin = 'https://cv.example.org';

describe('LanguageTool client', () => {
  it('only talks to this site', () => {
    expect(sameOriginEndpoint('/languagetool/v2/check', origin)?.toString()).toBe(
      'https://cv.example.org/languagetool/v2/check',
    );
    expect(sameOriginEndpoint('https://api.languagetool.org/v2/check', origin)).toBeNull();
    expect(sameOriginEndpoint('//evil.example/check', origin)).toBeNull();
    expect(sameOriginEndpoint('/\\evil.example', origin)).toBeNull();
    expect(sameOriginEndpoint('languagetool/v2/check', origin)).toBeNull();
  });

  it('maps resume languages', () => {
    expect(languageToolLanguage('en')).toBe('en-US');
    expect(languageToolLanguage('en-GB')).toBe('en-GB');
    expect(languageToolLanguage('fa-IR')).toBe('fa');
    expect(languageToolLanguage('ar')).toBe('ar');
    expect(languageToolLanguage('ckb')).toBeNull();
  });

  it('posts the text as a form and validates the answer', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          matches: [
            {
              message: 'Possible typo',
              offset: 10,
              length: 4,
              replacements: [{ value: 'their' }],
              rule: { id: 'TYPO' },
            },
            { message: 'Repeated word', offset: 0, length: 3 },
            { message: 'Out of range', offset: 100, length: 4 },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;
    const matches = await checkGrammar({
      endpoint: '/languagetool/v2/check',
      text: 'the the cat thier',
      language: 'en-US',
      origin,
      fetchImpl,
    });
    expect(matches.map((m) => m.message)).toEqual(['Repeated word', 'Possible typo']);
    expect(matches[0]?.replacements).toEqual([]);
    const sent = must(calls[0]);
    expect(sent.url).toBe('https://cv.example.org/languagetool/v2/check');
    expect(sent.init.credentials).toBe('omit');
    expect(String(sent.init.body)).toBe('text=the+the+cat+thier&language=en-US');
  });

  it('reports server problems plainly', async () => {
    const failing = (async () => new Response('nope', { status: 502 })) as unknown as typeof fetch;
    await expect(
      checkGrammar({ endpoint: '/lt', text: 'x', language: 'en-US', origin, fetchImpl: failing }),
    ).rejects.toThrow(GrammarError);
    const notAllowed = (async () => new Response('', { status: 405 })) as unknown as typeof fetch;
    await expect(
      checkGrammar({
        endpoint: '/lt',
        text: 'x',
        language: 'en-US',
        origin,
        fetchImpl: notAllowed,
      }),
    ).rejects.toMatchObject({ kind: 'status', status: 405 });
    const offline = (async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    await expect(
      checkGrammar({ endpoint: '/lt', text: 'x', language: 'en-US', origin, fetchImpl: offline }),
    ).rejects.toMatchObject({ kind: 'network' });
    const garbage = (async () =>
      new Response('{"matches": "no"}', { status: 200 })) as unknown as typeof fetch;
    await expect(
      checkGrammar({ endpoint: '/lt', text: 'x', language: 'en-US', origin, fetchImpl: garbage }),
    ).rejects.toThrow(/not understood/);
    await expect(
      checkGrammar({
        endpoint: 'https://x.io/lt',
        text: 'x',
        language: 'en-US',
        origin,
        fetchImpl: garbage,
      }),
    ).rejects.toThrow(/path on this site/);
  });
});
