// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { createResumeFromSample } from '@/samples';

import {
  fieldText,
  grammarFields,
  joinFields,
  locate,
  plainTextOf,
  replaceInField,
  setFieldValue,
} from './fields';

/** The value, or a test failure if it is missing. */
function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('Expected a value');
  return value;
}

describe('grammar fields', () => {
  it('reads plain text from HTML with blocks on their own lines, skipping code', () => {
    const { text } = plainTextOf(
      '<p>Led <strong>the</strong> team.</p><ul><li>Cut costs</li><li>Shipped <code>v2</code> fast</li></ul>',
    );
    expect(text).toBe('Led the team.\nCut costs\nShipped  fast');
  });

  it('corrects text inside one formatting run and refuses spans across runs', () => {
    const field = {
      id: 'x',
      kind: 'html',
      value: '<p>I <strong>leaded</strong> a teem.</p>',
      target: { type: 'profile', key: 'summaryHtml' },
    } as const;
    const text = fieldText(field);
    expect(text).toBe('I leaded a teem.');
    expect(replaceInField(field, text.indexOf('teem'), 4, 'team')).toBe(
      '<p>I <strong>leaded</strong> a team.</p>',
    );
    expect(replaceInField(field, text.indexOf('leaded'), 6, 'led')).toBe(
      '<p>I <strong>led</strong> a teem.</p>',
    );
    expect(replaceInField(field, 0, 8, 'I led')).toBeNull();
  });

  it('checks the prose of a resume in one request and writes fixes back', () => {
    const doc = createResumeFromSample('tech');
    const fields = grammarFields(doc);
    expect(fields[0]?.id).toBe('profile.headline');
    expect(fields.some((f) => f.id.endsWith(':descriptionHtml'))).toBe(true);
    expect(fields.some((f) => f.value === doc.profile.email)).toBe(false);

    const { text, spans } = joinFields(fields);
    const headline = must(fields[0]);
    expect(text.startsWith(headline.value)).toBe(true);
    const second = must(spans[1]);
    expect(locate(spans, second.start + 1, 2)).toEqual({ field: 1, offset: 1 });
    expect(locate(spans, must(spans[0]).end - 1, 4)).toBeNull();

    const fixed = setFieldValue(doc, headline, 'Staff engineer');
    expect(fixed.profile.headline).toBe('Staff engineer');
    const item = must(fields.find((f) => f.target.type === 'item' && f.target.key === 'title'));
    const changed = setFieldValue(doc, item, 'New title');
    expect(changed.sections.flatMap((s) => s.items).some((i) => i.title === 'New title')).toBe(
      true,
    );
  });
});
