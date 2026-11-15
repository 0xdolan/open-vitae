import JSZip from 'jszip';

import type { Table } from './csv';

/**
 * Minimal Excel (.xlsx) writer and reader. An .xlsx file is a zip of XML
 * files (Office Open XML, ECMA-376); this writes one sheet of text cells and
 * reads the text of the first sheet. No spreadsheet library is needed, and
 * nothing in the file is ever evaluated: cells are written as plain text, so
 * formulas cannot be injected.
 */

/** Excel's limit on the text in one cell. */
export const MAX_CELL_LENGTH = 32_767;
/** Refuse workbooks that would unpack to more than this. */
const MAX_UNPACKED_BYTES = 50 * 1024 * 1024;
const MAX_ENTRIES = 500;

export class XlsxError extends Error {
  override readonly name = 'XlsxError';
}

/** Characters XML 1.0 does not allow. */
// eslint-disable-next-line no-control-regex -- removing control characters is the point
const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

function escapeXml(text: string): string {
  return text
    .replace(INVALID_XML, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 0 → A, 25 → Z, 26 → AA. */
export function columnName(index: number): string {
  let name = '';
  let n = index + 1;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

/** A → 0, AA → 26. */
export function columnIndex(name: string): number {
  let index = 0;
  for (const char of name.toUpperCase()) index = index * 26 + (char.charCodeAt(0) - 64);
  return index - 1;
}

export interface SheetOptions {
  readonly sheetName?: string;
  readonly title?: string;
  /** Column widths in characters. */
  readonly widths?: readonly number[];
  /** Right-to-left sheet, for Persian, Arabic and Kurdish resumes. */
  readonly rightToLeft?: boolean;
}

export interface XlsxResult {
  readonly bytes: Uint8Array;
  /** Cells that were longer than Excel allows and were shortened. */
  readonly truncated: number;
}

/** Write rows as a one-sheet workbook. The first row is the header: bold, frozen and filterable. */
export async function writeXlsx(rows: Table, options: SheetOptions = {}): Promise<XlsxResult> {
  const sheetName = escapeXml((options.sheetName ?? 'Resume').slice(0, 31).replace(/[[\]:*?/\\]/g, ' '));
  let truncated = 0;
  const width = Math.max(1, ...rows.map((r) => r.length));
  const lastCell = `${columnName(width - 1)}${Math.max(1, rows.length)}`;

  const rowXml = rows
    .map((cells, r) => {
      const xml = cells
        .map((value, c) => {
          if (value === '') return '';
          let text = value;
          if (text.length > MAX_CELL_LENGTH) {
            text = text.slice(0, MAX_CELL_LENGTH);
            truncated += 1;
          }
          const style = r === 0 ? ' s="1"' : ' s="2"';
          return `<c r="${columnName(c)}${r + 1}" t="inlineStr"${style}><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
        })
        .join('');
      return `<row r="${r + 1}">${xml}</row>`;
    })
    .join('');

  const cols = (options.widths ?? [])
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.max(4, Math.min(120, w))}" customWidth="1"/>`)
    .join('');

  const sheet =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0"${options.rightToLeft ? ' rightToLeft="1"' : ''}>` +
    `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    (cols ? `<cols>${cols}</cols>` : '') +
    `<sheetData>${rowXml}</sheetData>` +
    (rows.length > 1 ? `<autoFilter ref="A1:${lastCell}"/>` : '') +
    `</worksheet>`;

  const styles =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
    `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="3">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="49" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/>` +
    `<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>` +
    `</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
      `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
      `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
      `</Types>`,
  );
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
      `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>` +
      `</Relationships>`,
  );
  zip.file(
    'docProps/core.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">` +
      `<dc:title>${escapeXml(options.title ?? 'Resume')}</dc:title><dc:creator>Open Vitae</dc:creator>` +
      `</cp:coreProperties>`,
  );
  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<sheets><sheet name="${sheetName}" sheetId="1" r:id="rId1"/></sheets>` +
      (rows.length > 1 ? `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${sheetName.replace(/'/g, "''")}'!$A$1:$${columnName(width - 1)}$${rows.length}</definedName></definedNames>` : '') +
      `</workbook>`,
  );
  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
      `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      `</Relationships>`,
  );
  zip.file('xl/styles.xml', styles);
  zip.file('xl/worksheets/sheet1.xml', sheet);

  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', mimeType: XLSX_MIME });
  return { bytes, truncated };
}

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function parseXml(text: string): Document {
  const xml = new DOMParser().parseFromString(text, 'application/xml');
  if (xml.getElementsByTagName('parsererror').length > 0) throw new XlsxError('The workbook contains broken XML.');
  return xml;
}

/** Elements by local name, whatever namespace prefix the file uses. */
function byName(node: Document | Element, name: string): Element[] {
  return Array.from(node.getElementsByTagNameNS('*', name));
}

/** Text of a <si> or <is>: plain <t>, or rich-text runs <r><t>. Phonetic hints (<rPh>) are skipped. */
function stringItemText(item: Element): string {
  return byName(item, 't')
    .filter((t) => t.parentElement?.localName !== 'rPh')
    .map((t) => t.textContent ?? '')
    .join('');
}

async function readEntry(zip: JSZip, path: string): Promise<string | null> {
  const file = zip.file(path);
  return file ? file.async('string') : null;
}

/** Read the text of the first sheet of a workbook. */
export async function readXlsx(data: ArrayBuffer | Uint8Array): Promise<Table> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(data);
  } catch {
    throw new XlsxError('This is not an Excel workbook (.xlsx).');
  }

  // Guard against zip bombs before unpacking anything.
  const entries = Object.values(zip.files);
  if (entries.length > MAX_ENTRIES) throw new XlsxError('This workbook has too many parts to read safely.');
  const unpacked = entries.reduce((sum, entry) => {
    const size = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
    return sum + size;
  }, 0);
  if (unpacked > MAX_UNPACKED_BYTES) throw new XlsxError('This workbook is too large to read safely.');

  // Find the first sheet through the workbook and its relationships.
  let sheetPath = 'xl/worksheets/sheet1.xml';
  const workbook = await readEntry(zip, 'xl/workbook.xml');
  const rels = await readEntry(zip, 'xl/_rels/workbook.xml.rels');
  if (workbook && rels) {
    const firstSheet = byName(parseXml(workbook), 'sheet')[0];
    const relId =
      firstSheet?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') ??
      firstSheet?.getAttribute('r:id');
    const target = byName(parseXml(rels), 'Relationship').find((r) => r.getAttribute('Id') === relId)?.getAttribute('Target');
    if (target) sheetPath = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
  }
  const sheetXml = await readEntry(zip, sheetPath);
  if (!sheetXml) throw new XlsxError('The workbook has no sheet to read.');

  const sharedXml = await readEntry(zip, 'xl/sharedStrings.xml');
  const shared = sharedXml ? byName(parseXml(sharedXml), 'si').map(stringItemText) : [];

  const table: Table = [];
  for (const rowElement of byName(parseXml(sheetXml), 'row')) {
    const rowNumber = Number(rowElement.getAttribute('r')) || table.length + 1;
    const cells: string[] = [];
    let nextColumn = 0;
    for (const cell of byName(rowElement, 'c')) {
      const ref = cell.getAttribute('r');
      const column = ref ? columnIndex(ref.replace(/\d+$/, '')) : nextColumn;
      nextColumn = column + 1;
      const type = cell.getAttribute('t');
      const valueElement = byName(cell, 'v')[0];
      let value = '';
      if (type === 's') value = shared[Number(valueElement?.textContent)] ?? '';
      else if (type === 'inlineStr') value = byName(cell, 'is')[0] ? stringItemText(byName(cell, 'is')[0] as Element) : '';
      else if (type === 'b') value = valueElement?.textContent === '1' ? 'TRUE' : 'FALSE';
      else value = valueElement?.textContent ?? '';
      while (cells.length < column) cells.push('');
      cells[column] = value;
    }
    while (table.length < rowNumber - 1) table.push([]);
    table[rowNumber - 1] = cells;
  }
  return table.filter((r) => r.some((cell) => cell.trim() !== ''));
}
