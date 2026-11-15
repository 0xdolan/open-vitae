import { ORIENTATIONS, isPageSizeId } from '@/config/page-sizes';
import { defaultSectionTitle, type SectionKind } from '@/config/sections';
import type { ItemInput, ProfileInput, ResumeInput, SectionInput } from '@/lib/resume-factory';
import { layoutSchema, type ResumeDocument, type ResumeLayout } from '@/schema/resume';

import type { Table } from './csv';
import { parseSectionKind } from './section-kind';

/**
 * The Open Vitae table: one resume as rows, for CSV and Excel. One row per
 * setting, profile field, link, section and entry, so it can be edited in a
 * spreadsheet and imported again.
 *
 *   Type     setting | profile | link | section | entry
 *   Section  the section heading (section and entry rows)
 *   Kind     experience, education, skills, … (optional; guessed from the heading)
 *   Title    setting or field name, link label, or entry title
 *   Subtitle, Dates, Location, URL   entry fields (URL also for links)
 *   Details  setting or field value, or the entry description in Markdown
 *   Hidden   "yes" for sections and entries hidden on the page
 */

export const TABLE_COLUMNS = ['Type', 'Section', 'Kind', 'Title', 'Subtitle', 'Dates', 'Location', 'URL', 'Details', 'Hidden'] as const;
type Column = (typeof TABLE_COLUMNS)[number];

/** Converts rich text to and from the text kept in a cell (Markdown). */
export interface TextCodec {
  toText(html: string): string;
  toHtml(text: string): string;
}

const PROFILE_FIELDS = [
  ['fullName', 'Full name'],
  ['headline', 'Headline'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['location', 'Location'],
  ['website', 'Website'],
  ['summaryHtml', 'Summary'],
] as const;

const SETTINGS = ['Name', 'Language', 'Direction', 'Page size', 'Orientation', 'Font', 'Accent colour'] as const;

const key = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

function row(values: Partial<Record<Column, string>>): string[] {
  return TABLE_COLUMNS.map((column) => values[column] ?? '');
}

/** A resume as table rows, with a header row first. */
export function resumeToTable(doc: ResumeDocument, codec: TextCodec): Table {
  const rows: Table = [[...TABLE_COLUMNS]];
  const { layout, profile } = doc;
  const settings: Record<(typeof SETTINGS)[number], string> = {
    Name: doc.name,
    Language: doc.language,
    Direction: layout.direction,
    'Page size': layout.pageSize,
    Orientation: layout.orientation,
    Font: layout.fontFamily,
    'Accent colour': layout.accentColor,
  };
  for (const name of SETTINGS) rows.push(row({ Type: 'setting', Title: name, Details: settings[name] }));
  for (const [field, label] of PROFILE_FIELDS) {
    const value = field === 'summaryHtml' ? codec.toText(profile.summaryHtml) : profile[field];
    rows.push(row({ Type: 'profile', Title: label, Details: value }));
  }
  for (const link of profile.links) rows.push(row({ Type: 'link', Title: link.label, URL: link.url }));
  for (const section of doc.sections) {
    const hidden = section.visible ? '' : 'yes';
    rows.push(row({ Type: 'section', Section: section.title, Kind: section.kind, Hidden: hidden }));
    for (const item of section.items) {
      rows.push(
        row({
          Type: 'entry',
          Section: section.title,
          Kind: section.kind,
          Title: item.title,
          Subtitle: item.subtitle,
          Dates: item.dateRange,
          Location: item.location,
          URL: item.url,
          Details: codec.toText(item.descriptionHtml),
          Hidden: item.visible ? '' : 'yes',
        }),
      );
    }
  }
  return rows;
}

export interface TableImport {
  readonly input: ResumeInput;
  readonly warnings: readonly string[];
}

const PROFILE_KEYS: Readonly<Record<string, (typeof PROFILE_FIELDS)[number][0]>> = {
  fullname: 'fullName',
  name: 'fullName',
  headline: 'headline',
  title: 'headline',
  email: 'email',
  phone: 'phone',
  telephone: 'phone',
  location: 'location',
  address: 'location',
  website: 'website',
  summary: 'summaryHtml',
  about: 'summaryHtml',
  profile: 'summaryHtml',
};

/** Read a table back into resume input. Unknown rows are skipped with a warning. */
export function tableToResume(table: Table, codec: TextCodec, fallbackName: string): TableImport {
  const warnings: string[] = [];
  const first = table[0] ?? [];
  const headerKeys = first.map(key);
  const hasHeader = headerKeys.includes('type') || headerKeys.includes('title') || headerKeys.includes('section');
  const columns: Readonly<Record<string, number>> = Object.fromEntries(
    (hasHeader ? headerKeys : TABLE_COLUMNS.map(key)).map((name, index) => [name, index]),
  );
  const get = (cells: readonly string[], column: Column) => {
    const index = columns[key(column)];
    return index === undefined ? '' : (cells[index] ?? '').trim();
  };

  let name = fallbackName;
  let language: string | undefined;
  const layout: Partial<ResumeLayout> = {};
  const profile: Record<string, string> = {};
  const links: { label: string; url: string }[] = [];
  const sections = new Map<string, { kind: SectionKind; title: string; visible: boolean; items: ItemInput[] }>();

  const sectionFor = (title: string, kindText: string) => {
    const kind = parseSectionKind(kindText, title);
    const heading = title || defaultSectionTitle(kind, language ?? 'en');
    const id = heading.toLowerCase();
    let section = sections.get(id);
    if (!section) {
      section = { kind, title: heading, visible: true, items: [] };
      sections.set(id, section);
    }
    return section;
  };

  const setLayout = (setting: string, value: string, line: number) => {
    const candidate = (() => {
      switch (key(setting)) {
        case 'direction':
          return { direction: value };
        case 'pagesize':
          return isPageSizeId(value) ? { pageSize: value } : null;
        case 'orientation':
          return (ORIENTATIONS as readonly string[]).includes(value) ? { orientation: value } : null;
        case 'font':
          return { fontFamily: value };
        case 'accentcolour':
        case 'accentcolor':
          return { accentColor: value };
        default:
          return undefined;
      }
    })();
    if (candidate === undefined) {
      warnings.push(`Row ${line}: unknown setting “${setting}” was skipped.`);
      return;
    }
    const [field, fieldValue] = candidate ? Object.entries(candidate)[0] ?? [] : [];
    const shape = layoutSchema.shape as Record<string, { safeParse(v: unknown): { success: boolean } }>;
    if (!field || !shape[field]?.safeParse(fieldValue).success) {
      warnings.push(`Row ${line}: “${value}” is not a valid ${setting.toLowerCase()} and was skipped.`);
      return;
    }
    Object.assign(layout, { [field]: fieldValue });
  };

  table.slice(hasHeader ? 1 : 0).forEach((cells, index) => {
    const line = index + (hasHeader ? 2 : 1);
    if (cells.every((cell) => cell.trim() === '')) return;
    const type = key(get(cells, 'Type')) || (get(cells, 'Section') ? 'entry' : '');
    const title = get(cells, 'Title');
    const details = get(cells, 'Details');
    const hidden = /^(yes|true|1|x|hidden)$/i.test(get(cells, 'Hidden'));

    switch (type) {
      case 'setting': {
        const settingKey = key(title);
        if (settingKey === 'name') name = details || name;
        else if (settingKey === 'language') language = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(details) ? details : language;
        else if (details) setLayout(title, details, line);
        break;
      }
      case 'profile': {
        const field = PROFILE_KEYS[key(title)];
        if (field) profile[field] = field === 'summaryHtml' ? codec.toHtml(details) : details;
        else warnings.push(`Row ${line}: unknown profile field “${title}” was skipped.`);
        break;
      }
      case 'link': {
        const url = get(cells, 'URL') || details;
        if (url) links.push({ label: title, url });
        break;
      }
      case 'section': {
        const section = sectionFor(get(cells, 'Section') || title, get(cells, 'Kind'));
        section.visible = !hidden;
        break;
      }
      case 'entry': {
        const section = sectionFor(get(cells, 'Section'), get(cells, 'Kind'));
        section.items.push({
          title,
          subtitle: get(cells, 'Subtitle'),
          dateRange: get(cells, 'Dates'),
          location: get(cells, 'Location'),
          url: get(cells, 'URL'),
          descriptionHtml: details ? codec.toHtml(details) : '',
          visible: !hidden,
        });
        break;
      }
      default:
        warnings.push(`Row ${line}: unknown type “${get(cells, 'Type')}” was skipped.`);
    }
  });

  const sectionInputs: SectionInput[] = [...sections.values()].map((s) => ({
    kind: s.kind,
    title: s.title,
    visible: s.visible,
    items: s.items,
  }));
  const profileInput: ProfileInput = { ...profile, links };
  return {
    input: { name, language, layout, profile: profileInput, sections: sectionInputs },
    warnings,
  };
}
