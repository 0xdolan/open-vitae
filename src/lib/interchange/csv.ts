/**
 * CSV reading and writing (RFC 4180), with the protections spreadsheets need.
 *
 * Writing: every cell that would start with = + - @ or a tab or carriage
 * return gets a leading apostrophe, so a spreadsheet never runs it as a
 * formula (OWASP "CSV injection"). Reading removes that apostrophe again.
 */

export type Table = string[][];

const FORMULA_START = /^[=+\-@\t\r]/;

/** Make a cell safe to open in a spreadsheet. */
export function protectCell(value: string): string {
  return FORMULA_START.test(value) ? `'${value}` : value;
}

/** Undo protectCell. */
export function unprotectCell(value: string): string {
  return value.startsWith("'") && FORMULA_START.test(value.slice(1)) ? value.slice(1) : value;
}

function quote(value: string, delimiter: string): string {
  return /["\r\n]/.test(value) || value.includes(delimiter)
    ? `"${value.replace(/"/g, '""')}"`
    : value;
}

/**
 * Rows to CSV text. Starts with a byte order mark so Excel opens UTF-8
 * (Persian, Arabic, Kurdish) correctly, and uses CRLF line ends.
 */
export function toCsv(rows: Table, delimiter = ','): string {
  const body = rows
    .map((row) => row.map((cell) => quote(protectCell(cell), delimiter)).join(delimiter))
    .join('\r\n');
  return `\uFEFF${body}\r\n`;
}

/** The delimiter used in the first line: comma, semicolon (common in Europe) or tab. */
export function detectDelimiter(text: string): ',' | ';' | '\t' {
  let firstLine = '';
  let inQuotes = false;
  for (const char of text) {
    if (char === '"') inQuotes = !inQuotes;
    if (!inQuotes && (char === '\n' || char === '\r')) break;
    firstLine += char;
  }
  const outside = firstLine.replace(/"[^"]*"/g, '');
  const counts = { ',': 0, ';': 0, '\t': 0 } as Record<',' | ';' | '\t', number>;
  for (const char of outside) if (char in counts) counts[char as ',' | ';' | '\t'] += 1;
  if (counts['\t'] > counts[','] && counts['\t'] >= counts[';']) return '\t';
  if (counts[';'] > counts[',']) return ';';
  return ',';
}

export class CsvError extends Error {
  override readonly name = 'CsvError';
}

/**
 * Parse CSV text into rows of cells. Handles quoted cells with commas, quotes
 * and line breaks, a byte order mark, and CRLF or LF line ends. Blank lines
 * are skipped. Throws CsvError on an unclosed quote.
 */
export function parseCsv(
  text: string,
  delimiter: string = detectDelimiter(text.replace(/^\uFEFF/, '')),
): Table {
  const input = text.replace(/^\uFEFF/, '');
  const rows: Table = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  const endCell = () => {
    row.push(cell);
    cell = '';
  };
  const endRow = () => {
    endCell();
    if (row.length > 1 || row[0] !== '') rows.push(row);
    row = [];
  };

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i] as string;
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"' && cell === '') {
      inQuotes = true;
    } else if (char === delimiter) {
      endCell();
    } else if (char === '\n') {
      endRow();
    } else if (char === '\r') {
      if (input[i + 1] === '\n') i += 1;
      endRow();
    } else {
      cell += char;
    }
  }
  if (inQuotes) throw new CsvError('The file has a quote that is never closed.');
  if (cell !== '' || row.length > 0) endRow();
  // The protecting apostrophe can sit inside quotes or not; remove it either way.
  return rows.map((r) => r.map(unprotectCell));
}
