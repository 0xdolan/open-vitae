// @vitest-environment jsdom
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import { columnIndex, columnName, MAX_CELL_LENGTH, readXlsx, writeXlsx, XlsxError } from './xlsx';

describe('xlsx', () => {
  it('names columns like Excel', () => {
    expect([0, 25, 26, 701, 702].map(columnName)).toEqual(['A', 'Z', 'AA', 'ZZ', 'AAA']);
    expect(['A', 'Z', 'AA', 'ZZ', 'AAA'].map(columnIndex)).toEqual([0, 25, 26, 701, 702]);
  });

  it('writes a workbook and reads the same cells back, in any script', async () => {
    const rows = [
      ['Type', 'Title', 'Details'],
      ['entry', 'Engineer & lead <3>', 'Line one\nLine two'],
      ['entry', '', 'ئەزموونی کار'],
      ['=1+1', 'formulas stay text', ''],
    ];
    const { bytes, truncated } = await writeXlsx(rows, { widths: [10, 30, 60], rightToLeft: true });
    expect(truncated).toBe(0);
    expect(await readXlsx(bytes)).toEqual(rows.map((r) => {
      const copy = [...r];
      while (copy.length > 0 && copy[copy.length - 1] === '') copy.pop();
      return copy;
    }));

    const zip = await JSZip.loadAsync(bytes);
    const sheet = (await zip.file('xl/worksheets/sheet1.xml')?.async('string')) ?? '';
    expect(sheet).toContain('rightToLeft="1"');
    expect(sheet).toContain('state="frozen"');
    expect(sheet).not.toContain('<f>');
  });

  it('shortens cells longer than Excel allows', async () => {
    const { bytes, truncated } = await writeXlsx([['h'], ['x'.repeat(MAX_CELL_LENGTH + 10)]]);
    expect(truncated).toBe(1);
    expect((await readXlsx(bytes))[1]?.[0]).toHaveLength(MAX_CELL_LENGTH);
  });

  it('reads shared strings, rich text and gaps as written by Excel', async () => {
    const zip = new JSZip();
    zip.file('xl/sharedStrings.xml', '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>Type</t></si><si><r><t>Ti</t></r><r><t>tle</t></r></si><si><t>entry</t></si></sst>');
    zip.file(
      'xl/worksheets/sheet1.xml',
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' +
        '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="s"><v>1</v></c></row>' +
        '<row r="3"><c r="A3" t="s"><v>2</v></c><c r="C3"><v>2021</v></c></row>' +
        '</sheetData></worksheet>',
    );
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    expect(await readXlsx(bytes)).toEqual([
      ['Type', '', 'Title'],
      ['entry', '', '2021'],
    ]);
  });

  it('refuses files that are not workbooks', async () => {
    await expect(readXlsx(new TextEncoder().encode('not a zip'))).rejects.toThrow(XlsxError);
    const empty = await new JSZip().generateAsync({ type: 'uint8array' });
    await expect(readXlsx(empty)).rejects.toThrow(XlsxError);
  });
});
