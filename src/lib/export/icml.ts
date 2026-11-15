import { isSafeUrl } from '@/lib/url';
import type { ResumeDocument } from '@/schema/resume';

/**
 * InDesign export as ICML (InCopy Markup Language): one text story with
 * named paragraph and character styles. In InDesign, use File › Place to put
 * it into a text frame of any layout; restyle everything by editing the
 * styles (Name, Headline, Section title, Entry title, Body, Bullet 1–4, …).
 * The same approach as Pandoc's ICML writer. The photo is not included
 * (place it as an image), and colours are left to the styles.
 * Browser only (uses DOMParser for rich text).
 */

const PARAGRAPH_STYLES = [
  'Name',
  'Headline',
  'Contact',
  'Body',
  'Section title',
  'Entry title',
  'Entry details',
  'Heading',
  'Bullet 1',
  'Bullet 2',
  'Bullet 3',
  'Bullet 4',
  'Numbered 1',
  'Numbered 2',
  'Numbered 3',
  'Numbered 4',
  'Code',
  'Quote',
] as const;
type ParagraphStyle = (typeof PARAGRAPH_STYLES)[number];

const CHARACTER_STYLES = ['Bold', 'Italic', 'Bold Italic', 'Underline', 'Strikethrough', 'Superscript', 'Subscript', 'Code', 'Link'] as const;
type CharacterStyle = (typeof CHARACTER_STYLES)[number];

// eslint-disable-next-line no-control-regex -- XML 1.0 forbids these characters
const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;
const esc = (text: string) =>
  text.replace(INVALID_XML, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface Run {
  readonly text: string;
  readonly style: CharacterStyle | null;
  readonly link?: string;
}

interface Para {
  readonly style: ParagraphStyle;
  readonly runs: readonly Run[];
}

function styleFor(flags: { bold: boolean; italic: boolean; underline: boolean; strike: boolean; sup: boolean; sub: boolean; code: boolean }): CharacterStyle | null {
  if (flags.code) return 'Code';
  if (flags.sup) return 'Superscript';
  if (flags.sub) return 'Subscript';
  if (flags.bold && flags.italic) return 'Bold Italic';
  if (flags.bold) return 'Bold';
  if (flags.italic) return 'Italic';
  if (flags.underline) return 'Underline';
  if (flags.strike) return 'Strikethrough';
  return null;
}

type Flags = Parameters<typeof styleFor>[0];
const NO_FLAGS: Flags = { bold: false, italic: false, underline: false, strike: false, sup: false, sub: false, code: false };

function runsOf(node: Node, flags: Flags, link?: string): Run[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? '').replace(/\s+/g, ' ');
    return text ? [{ text, style: link ? 'Link' : styleFor(flags), link }] : [];
  }
  if (!(node instanceof Element)) return [];
  const next = { ...flags };
  let nextLink = link;
  switch (node.tagName) {
    case 'STRONG':
    case 'B':
      next.bold = true;
      break;
    case 'EM':
    case 'I':
      next.italic = true;
      break;
    case 'U':
      next.underline = true;
      break;
    case 'S':
    case 'DEL':
      next.strike = true;
      break;
    case 'SUP':
      next.sup = true;
      break;
    case 'SUB':
      next.sub = true;
      break;
    case 'CODE':
      next.code = true;
      break;
    case 'BR':
      return [{ text: ' ', style: null }];
    case 'IMG':
      return [];
    case 'A': {
      const href = node.getAttribute('href') ?? '';
      if (isSafeUrl(href)) nextLink = href;
      break;
    }
    default:
      break;
  }
  return Array.from(node.childNodes).flatMap((child) => runsOf(child, next, nextLink));
}

function listParas(list: Element, level: number): Para[] {
  const kind = list.tagName === 'OL' ? 'Numbered' : 'Bullet';
  const style = `${kind} ${Math.min(level + 1, 4)}` as ParagraphStyle;
  const out: Para[] = [];
  for (const item of Array.from(list.children).filter((c) => c.tagName === 'LI')) {
    const runs: Run[] = [];
    const nested: Element[] = [];
    for (const child of Array.from(item.childNodes)) {
      if (child instanceof Element && (child.tagName === 'UL' || child.tagName === 'OL')) nested.push(child);
      else runs.push(...runsOf(child, NO_FLAGS));
    }
    out.push({ style, runs });
    for (const sub of nested) out.push(...listParas(sub, level + 1));
  }
  return out;
}

function parasOf(html: string): Para[] {
  if (html.trim() === '') return [];
  const template = document.createElement('template');
  template.innerHTML = html;
  const out: Para[] = [];
  for (const node of Array.from(template.content.childNodes)) {
    if (!(node instanceof Element)) {
      const runs = runsOf(node, NO_FLAGS);
      if (runs.some((r) => r.text.trim())) out.push({ style: 'Body', runs });
      continue;
    }
    switch (node.tagName) {
      case 'UL':
      case 'OL':
        out.push(...listParas(node, 0));
        break;
      case 'H1':
      case 'H2':
      case 'H3':
      case 'H4':
        out.push({ style: 'Heading', runs: runsOf(node, NO_FLAGS) });
        break;
      case 'PRE':
        for (const line of (node.textContent ?? '').replace(/\n$/, '').split('\n')) out.push({ style: 'Code', runs: [{ text: line, style: null }] });
        break;
      case 'BLOCKQUOTE':
        out.push(...parasOf(node.innerHTML).map((p) => ({ ...p, style: 'Quote' as const })));
        break;
      case 'TABLE':
        // A story has no tables: one paragraph per row, cells separated by tabs.
        for (const row of Array.from(node.querySelectorAll('tr'))) {
          const runs: Run[] = [];
          Array.from(row.children).forEach((cell, index) => {
            if (index > 0) runs.push({ text: '\t', style: null });
            runs.push(...runsOf(cell, { ...NO_FLAGS, bold: cell.tagName === 'TH' }));
          });
          out.push({ style: 'Body', runs });
        }
        break;
      case 'HR':
        break;
      default:
        out.push({ style: 'Body', runs: runsOf(node, NO_FLAGS) });
    }
  }
  return out;
}

/** Build the story: header, summary, sections and entries. */
function storyOf(doc: ResumeDocument): Para[] {
  const { profile } = doc;
  const plain = (text: string, style: CharacterStyle | null = null): Run => ({ text, style });
  const paras: Para[] = [];
  if (profile.fullName) paras.push({ style: 'Name', runs: [plain(profile.fullName)] });
  if (profile.headline) paras.push({ style: 'Headline', runs: [plain(profile.headline)] });
  const contacts: Run[] = [];
  const add = (run: Run) => {
    if (contacts.length > 0) contacts.push(plain('  •  '));
    contacts.push(run);
  };
  if (profile.email) add({ text: profile.email, style: 'Link', link: `mailto:${profile.email}` });
  if (profile.phone) add(plain(profile.phone));
  if (profile.location) add(plain(profile.location));
  if (profile.website && isSafeUrl(profile.website)) add({ text: profile.website.replace(/^https?:\/\//, ''), style: 'Link', link: profile.website });
  for (const link of profile.links.filter((l) => l.url && isSafeUrl(l.url))) add({ text: link.label || link.url, style: 'Link', link: link.url });
  if (contacts.length > 0) paras.push({ style: 'Contact', runs: contacts });
  paras.push(...parasOf(profile.summaryHtml));

  for (const section of doc.sections.filter((s) => s.visible)) {
    paras.push({ style: 'Section title', runs: [plain(section.title)] });
    for (const item of section.items.filter((i) => i.visible)) {
      if (item.title || item.dateRange) {
        const title: Run = item.url && isSafeUrl(item.url) ? { text: item.title, style: 'Link', link: item.url } : plain(item.title);
        paras.push({ style: 'Entry title', runs: item.dateRange ? [title, plain('\t'), plain(item.dateRange)] : [title] });
      }
      const details = [item.subtitle, item.location].filter(Boolean).join(' · ');
      if (details) paras.push({ style: 'Entry details', runs: [plain(details)] });
      paras.push(...parasOf(item.descriptionHtml));
    }
  }
  return paras.filter((p) => p.runs.length > 0);
}

const styleRef = (kind: 'ParagraphStyle' | 'CharacterStyle', name: string) => `${kind}/${esc(name)}`;
const NO_CHAR = 'CharacterStyle/$ID/[No character style]';

/** The ICML file for a resume. */
export function buildIcml(doc: ResumeDocument): string {
  const { layout } = doc;
  const rtl = layout.direction === 'rtl';
  const base = layout.baseFontSizePt;
  const font = esc(layout.fontFamily);
  const direction = rtl ? ' ParagraphDirection="RightToLeftDirection" CharacterDirection="RightToLeftDirection"' : '';

  const paragraphStyle = (name: ParagraphStyle) => {
    const sizes: Partial<Record<ParagraphStyle, number>> = { Name: base * 2.2, Headline: base * 1.1, 'Section title': base * 1.1, Contact: base * 0.9, 'Entry details': base * 0.9, Code: base * 0.9 };
    const bold = ['Name', 'Section title', 'Entry title', 'Heading'].includes(name);
    const level = /\s(\d)$/.exec(name)?.[1];
    const list = name.startsWith('Bullet') ? 'BulletList' : name.startsWith('Numbered') ? 'NumberedList' : null;
    const indent = level ? Number(level) * 12 : 0;
    const extras = [
      `PointSize="${(sizes[name] ?? base).toFixed(1)}"`,
      bold ? 'FontStyle="Bold"' : '',
      name === 'Section title' ? 'Capitalization="AllCaps" SpaceBefore="12" SpaceAfter="4" RuleBelow="true" RuleBelowWeight="0.75" RuleBelowOffset="3"' : '',
      name === 'Entry title' ? 'SpaceBefore="6" KeepWithNext="2"' : '',
      list ? `BulletsAndNumberingListType="${list}" LeftIndent="${indent}" FirstLineIndent="-12"` : '',
      name === 'Quote' ? 'LeftIndent="12" FontStyle="Italic"' : '',
    ]
      .filter(Boolean)
      .join(' ');
    const fontName = name === 'Code' ? 'Courier New' : layout.fontFamily;
    return `<ParagraphStyle Self="${styleRef('ParagraphStyle', name)}" Name="${esc(name)}" ${extras}${direction}><Properties><BasedOn type="string">$ID/NormalParagraphStyle</BasedOn><AppliedFont type="string">${esc(fontName)}</AppliedFont><Leading type="unit">${(base * layout.lineHeight).toFixed(1)}</Leading></Properties></ParagraphStyle>`;
  };

  const characterStyle = (name: CharacterStyle) => {
    const attributes: Record<CharacterStyle, string> = {
      Bold: 'FontStyle="Bold"',
      Italic: 'FontStyle="Italic"',
      'Bold Italic': 'FontStyle="Bold Italic"',
      Underline: 'Underline="true"',
      Strikethrough: 'StrikeThru="true"',
      Superscript: 'Position="Superscript"',
      Subscript: 'Position="Subscript"',
      Code: '',
      Link: 'Underline="true"',
    };
    const properties = name === 'Code' ? '<Properties><AppliedFont type="string">Courier New</AppliedFont></Properties>' : '';
    return `<CharacterStyle Self="${styleRef('CharacterStyle', name)}" Name="${esc(name)}" ${attributes[name]}>${properties}</CharacterStyle>`;
  };

  // Hyperlinks: a text source in the story, and a destination and link at document level.
  const hyperlinks: string[] = [];
  const destinations = new Map<string, string>();
  let linkCount = 0;

  const paragraphs = storyOf(doc)
    .map((para) => {
      const ranges = para.runs
        .map((run) => {
          const applied = run.style ? styleRef('CharacterStyle', run.style) : NO_CHAR;
          const content = run.text
            .split(' ')
            .map((part) => `<Content>${esc(part)}</Content>`)
            .join('<Br/>');
          if (!run.link) return `<CharacterStyleRange AppliedCharacterStyle="${applied}">${content}</CharacterStyleRange>`;
          linkCount += 1;
          const sourceId = `htss-${linkCount}`;
          let destinationId = destinations.get(run.link);
          if (!destinationId) {
            destinationId = `HyperlinkURLDestination/${destinations.size + 1}`;
            destinations.set(run.link, destinationId);
          }
          hyperlinks.push(
            `<Hyperlink Self="hl-${linkCount}" Name="${esc(run.text)}" Source="${sourceId}" Visible="false" DestinationUniqueKey="${linkCount}"><Properties><BorderColor type="enumeration">Black</BorderColor><Destination type="object">${destinationId}</Destination></Properties></Hyperlink>`,
          );
          return `<CharacterStyleRange AppliedCharacterStyle="${applied}"><HyperlinkTextSource Self="${sourceId}" Name="${esc(run.text)}" Hidden="false">${content}</HyperlinkTextSource></CharacterStyleRange>`;
        })
        .join('');
      return `<ParagraphStyleRange AppliedParagraphStyle="${styleRef('ParagraphStyle', para.style)}">${ranges}<Br/></ParagraphStyleRange>`;
    })
    .join('\n');

  const destinationXml = [...destinations.entries()]
    .map(([url, id], index) => `<HyperlinkURLDestination Self="${id}" Name="${esc(url)}" DestinationURL="${esc(url)}" DestinationUniqueKey="${index + 1}"/>`)
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<?aid style="50" type="snippet" readerVersion="6.0" featureSet="513" product="8.0(370)" ?>',
    '<?aid SnippetType="InCopyInterchange"?>',
    '<Document DOMVersion="8.0" Self="open_vitae">',
    '<RootCharacterStyleGroup Self="open_vitae_char_styles">',
    `<CharacterStyle Self="${NO_CHAR}" Name="$ID/[No character style]"/>`,
    ...CHARACTER_STYLES.map(characterStyle),
    '</RootCharacterStyleGroup>',
    '<RootParagraphStyleGroup Self="open_vitae_para_styles">',
    `<ParagraphStyle Self="ParagraphStyle/$ID/NormalParagraphStyle" Name="$ID/NormalParagraphStyle"${direction}><Properties><AppliedFont type="string">${font}</AppliedFont></Properties></ParagraphStyle>`,
    ...PARAGRAPH_STYLES.map(paragraphStyle),
    '</RootParagraphStyleGroup>',
    `<Story Self="open_vitae_story" AppliedTOCStyle="n" TrackChanges="false" StoryTitle="${esc(doc.profile.fullName || doc.name)}" AppliedNamedGrid="n">`,
    `<StoryPreference OpticalMarginAlignment="false" OpticalMarginSize="12" FrameType="TextFrameType" StoryOrientation="Horizontal" StoryDirection="${rtl ? 'RightToLeftDirection' : 'LeftToRightDirection'}"/>`,
    paragraphs,
    '</Story>',
    destinationXml,
    ...hyperlinks,
    '</Document>',
    '',
  ].join('\n');
}
