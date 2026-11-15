import { describe, expect, it } from 'vitest';

import { SAMPLE_IDS, createResumeFromSample } from '@/samples';

import { htmlToPlain, isPlainCompatible, plainToHtml } from './plain-text';

describe('plain text conversion', () => {
  it('turns paragraphs and bullets into plain text', () => {
    expect(htmlToPlain('<p>Intro</p><ul><li>One</li><li>Two</li></ul><p>Outro</p>')).toBe(
      'Intro\n\n- One\n- Two\n\nOutro',
    );
  });

  it('turns plain text back into the same HTML', () => {
    expect(plainToHtml('Intro\n\n- One\n- Two\n\nOutro')).toBe(
      '<p>Intro</p><ul><li>One</li><li>Two</li></ul><p>Outro</p>',
    );
  });

  it('keeps single line breaks inside a paragraph', () => {
    expect(plainToHtml('Line one\nLine two')).toBe('<p>Line one<br>Line two</p>');
    expect(htmlToPlain('<p>Line one<br>Line two</p>')).toBe('Line one\nLine two');
  });

  it('accepts other bullet characters', () => {
    expect(plainToHtml('• a\n* b')).toBe('<ul><li>a</li><li>b</li></ul>');
  });

  it('escapes and decodes special characters safely', () => {
    expect(plainToHtml('Tom & Jerry <script>')).toBe('<p>Tom &amp; Jerry &lt;script&gt;</p>');
    expect(htmlToPlain('<p>ATT&amp;CK &lt;b&gt; &#39;x&#39; &#x2014;</p>')).toBe("ATT&CK <b> 'x' —");
  });

  it('round-trips every sample description without changes', () => {
    for (const id of SAMPLE_IDS) {
      const doc = createResumeFromSample(id);
      const htmls = [doc.profile.summaryHtml, ...doc.sections.flatMap((s) => s.items.map((i) => i.descriptionHtml))];
      for (const html of htmls.filter(Boolean)) {
        expect(isPlainCompatible(html)).toBe(true);
        expect(plainToHtml(htmlToPlain(html))).toBe(html);
      }
    }
  });

  it('detects formatting the basic editor cannot keep', () => {
    expect(isPlainCompatible('<p>plain</p><ul><li>x</li></ul>')).toBe(true);
    expect(isPlainCompatible('<p><strong>bold</strong></p>')).toBe(false);
    expect(isPlainCompatible('<p dir="rtl">x</p>')).toBe(false);
    expect(isPlainCompatible('<ol><li>x</li></ol>')).toBe(false);
  });

  it('handles empty input', () => {
    expect(plainToHtml('')).toBe('');
    expect(plainToHtml('\n\n  \n')).toBe('');
    expect(htmlToPlain('')).toBe('');
  });
});
