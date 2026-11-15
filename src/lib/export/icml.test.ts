// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { createResumeFromSample } from '@/samples';

import { buildIcml } from './icml';

const parse = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml');

describe('ICML export', () => {
  it('writes well-formed ICML with styled paragraphs and links', () => {
    const doc = createResumeFromSample('tech', 'Tech');
    const xml = buildIcml(doc);
    const dom = parse(xml);
    expect(dom.getElementsByTagName('parsererror')).toHaveLength(0);
    expect(xml).toContain('<?aid SnippetType="InCopyInterchange"?>');

    const styles = Array.from(dom.getElementsByTagName('ParagraphStyleRange')).map((p) => p.getAttribute('AppliedParagraphStyle'));
    expect(styles[0]).toBe('ParagraphStyle/Name');
    expect(styles).toContain('ParagraphStyle/Section title');
    expect(styles).toContain('ParagraphStyle/Bullet 1');

    const content = Array.from(dom.getElementsByTagName('Content')).map((c) => c.textContent).join('');
    expect(content).toContain(doc.profile.fullName);
    expect(content).toContain(doc.sections[0]?.title ?? '');

    // Every hyperlink points at a destination that exists, and every source exists in the story.
    const destinations = new Set(Array.from(dom.getElementsByTagName('HyperlinkURLDestination')).map((d) => d.getAttribute('Self')));
    const sources = new Set(Array.from(dom.getElementsByTagName('HyperlinkTextSource')).map((s) => s.getAttribute('Self')));
    const links = Array.from(dom.getElementsByTagName('Hyperlink'));
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(sources.has(link.getAttribute('Source'))).toBe(true);
      expect(destinations.has(link.getElementsByTagName('Destination')[0]?.textContent ?? '')).toBe(true);
    }
  });

  it('marks a right-to-left story and escapes text', () => {
    const doc = createResumeFromSample('kurdish', 'Kurdish');
    const xml = buildIcml({ ...doc, profile: { ...doc.profile, headline: 'A & B <c>' } });
    expect(parse(xml).getElementsByTagName('parsererror')).toHaveLength(0);
    expect(xml).toContain('StoryDirection="RightToLeftDirection"');
    expect(xml).toContain('ParagraphDirection="RightToLeftDirection"');
    expect(xml).toContain('A &amp; B &lt;c&gt;');
    expect(xml).toContain('ئاوات کەریم');
  });
});
