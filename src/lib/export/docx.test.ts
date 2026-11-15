// @vitest-environment jsdom
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import { createResumeFromSample } from '@/samples';

import { buildDocx } from './docx';

async function partsOf(blob: Blob) {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const read = async (path: string) => (await zip.file(path)?.async('string')) ?? '';
  return { zip, document: await read('word/document.xml'), rels: await read('word/_rels/document.xml.rels'), numbering: await read('word/numbering.xml'), core: await read('docProps/core.xml') };
}

describe('docx export', () => {
  it('writes an editable Word document with the resume content', async () => {
    const doc = createResumeFromSample('tech', 'Tech');
    const { document, rels, numbering, core } = await partsOf(await buildDocx(doc));
    expect(document).toContain(doc.profile.fullName);
    expect(document).toContain(doc.sections[0]?.items[0]?.title ?? '');
    expect(document).toContain('w:numPr');
    expect(numbering).toContain('w:abstractNum');
    expect(rels).toContain('mailto:');
    expect(rels).toContain('TargetMode="External"');
    expect(document).toContain('w:pgSz');
    expect(core).toContain(doc.profile.fullName);
    expect(document).not.toContain('<w:bidi/>');
  });

  it('writes right-to-left paragraphs for a Kurdish resume', async () => {
    const doc = createResumeFromSample('kurdish', 'Kurdish');
    const { document } = await partsOf(await buildDocx(doc));
    expect(document).toContain('ئاوات کەریم');
    expect(document).toContain('<w:bidi/>');
    expect(document).toContain('<w:rtl/>');
  });

  it('uses the page size and orientation of the resume', async () => {
    const doc = createResumeFromSample('finance', 'Finance');
    const { document } = await partsOf(await buildDocx({ ...doc, layout: { ...doc.layout, orientation: 'landscape' } }));
    // US Letter landscape: 11 × 8.5 inches = 15840 × 12240 twips.
    expect(document).toMatch(/w:w="1584\d"/);
    expect(document).toContain('w:orient="landscape"');
  });
});
