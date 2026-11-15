import { describe, expect, it } from 'vitest';

import { resumeSchema } from '@/schema/resume';

import { createResumeFromSample, getSample, SAMPLE_IDS, SAMPLES } from './index';

describe('samples', () => {
  it('ships the five required samples', () => {
    expect(SAMPLES.map((s) => s.id)).toEqual(['tech', 'finance', 'cybersecurity', 'cloud', 'marketing']);
    expect([...SAMPLE_IDS]).toEqual(SAMPLES.map((s) => s.id));
  });

  it.each(SAMPLE_IDS)('%s builds a valid, complete resume', (id) => {
    const doc = createResumeFromSample(id);
    expect(resumeSchema.safeParse(doc).success).toBe(true);
    expect(doc.profile.fullName).not.toBe('');
    expect(doc.profile.email).toMatch(/@example\.com$/);
    expect(doc.sections.length).toBeGreaterThanOrEqual(4);
    expect(doc.sections.some((s) => s.kind === 'experience' && s.items.length >= 2)).toBe(true);
  });

  it('uses only fictional example.com links', () => {
    for (const id of SAMPLE_IDS) {
      const doc = createResumeFromSample(id);
      const urls = [
        doc.profile.website,
        ...doc.profile.links.map((l) => l.url),
        ...doc.sections.flatMap((s) => s.items.map((i) => i.url)),
      ].filter(Boolean);
      for (const url of urls) {
        expect(new URL(url).hostname.endsWith('example.com')).toBe(true);
      }
    }
  });

  it('gives each copy fresh ids and leaves the template unchanged', () => {
    const before = JSON.stringify(getSample('finance').input);
    const a = createResumeFromSample('finance');
    const b = createResumeFromSample('finance');
    expect(a.id).not.toBe(b.id);
    expect(JSON.stringify(getSample('finance').input)).toBe(before);
  });

  it('uses the custom name when one is given', () => {
    expect(createResumeFromSample('marketing', 'My copy').name).toBe('My copy');
  });

  it('escapes ampersands in rich text', () => {
    for (const id of SAMPLE_IDS) {
      const doc = createResumeFromSample(id);
      const htmls = [doc.profile.summaryHtml, ...doc.sections.flatMap((s) => s.items.map((i) => i.descriptionHtml))];
      for (const html of htmls) {
        expect(/&(?!amp;|lt;|gt;|quot;|#\d+;)/.test(html)).toBe(false);
      }
    }
  });
});
