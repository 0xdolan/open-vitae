import { describe, expect, it } from 'vitest';

import { CsvError, detectDelimiter, parseCsv, protectCell, toCsv, unprotectCell } from './csv';

describe('csv', () => {
  it('writes and reads back cells with commas, quotes, line breaks and any script', () => {
    const rows = [
      ['Type', 'Title', 'Details'],
      ['entry', 'Engineer, Senior', 'Said "hello"\nthen left'],
      ['entry', 'ئەندازیار', 'مهندس نرم‌افزار'],
    ];
    const text = toCsv(rows);
    expect(text.startsWith('﻿')).toBe(true);
    expect(text).toContain('"Engineer, Senior"');
    expect(text).toContain('"Said ""hello""\nthen left"');
    expect(parseCsv(text)).toEqual(rows);
  });

  it('stops spreadsheet formulas and restores the text on import', () => {
    expect(protectCell('=HYPERLINK("x")')).toBe(`'=HYPERLINK("x")`);
    expect(protectCell('- a bullet')).toBe(`'- a bullet`);
    expect(protectCell('plain')).toBe('plain');
    expect(unprotectCell(`'=1+1`)).toBe('=1+1');
    expect(unprotectCell(`'quoted`)).toBe(`'quoted`);
    const rows = [['=1+1', '@user', '- item\n- item']];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });

  it('detects semicolon and tab delimiters', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a\tb\tc')).toBe('\t');
    expect(detectDelimiter('"a;b",c')).toBe(',');
    expect(parseCsv('Type;Title\r\nentry;"x;y"\r\n')).toEqual([
      ['Type', 'Title'],
      ['entry', 'x;y'],
    ]);
  });

  it('skips blank lines and accepts a missing final line end', () => {
    expect(parseCsv('a,b\n\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
    expect(parseCsv('a,,c')).toEqual([['a', '', 'c']]);
  });

  it('reports an unclosed quote', () => {
    expect(() => parseCsv('a,"b\n1,2')).toThrow(CsvError);
  });
});
