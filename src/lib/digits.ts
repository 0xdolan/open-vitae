import { DIGIT_SYSTEMS, type DigitSystem } from '@/config/layout';
import type { ResumeDocument } from '@/schema/resume';

export { DIGIT_SYSTEMS, type DigitSystem };

const SETS: Readonly<Record<DigitSystem, string>> = {
  latn: '0123456789',
  arab: '٠١٢٣٤٥٦٧٨٩',
  arabext: '۰۱۲۳۴۵۶۷۸۹',
};

/** Value of any Western, Arabic-Indic or Persian digit. */
function digitValue(char: string): number {
  for (const set of Object.values(SETS)) {
    const index = set.indexOf(char);
    if (index >= 0) return index;
  }
  return -1;
}

const ANY_DIGIT = /[0-9٠-٩۰-۹]/g;

/** Write every digit in `text` with the chosen digit set: toDigits("2024", "arab") → "٢٠٢٤". */
export function toDigits(text: string, system: DigitSystem): string {
  const target = SETS[system];
  return text.replace(ANY_DIGIT, (char) => target[digitValue(char)] ?? char);
}

/** The digits people usually write in a language: Persian digits for fa, Arabic-Indic for ar and ckb. */
export function defaultDigits(language: string): DigitSystem {
  const base = language.toLowerCase().split('-')[0];
  if (base === 'fa') return 'arabext';
  if (base === 'ar' || base === 'ckb') return 'arab';
  return 'latn';
}

/** Elements whose text keeps its digits: links and code. */
const KEEP = new Set(['a', 'code', 'pre', 'kbd', 'samp']);

/**
 * Convert digits in the text of sanitised HTML, leaving tags, attributes,
 * character references (&#160;) and the text of links and code untouched.
 */
export function htmlToDigits(html: string, system: DigitSystem): string {
  let keepDepth = 0;
  return html
    .split(/(<[^>]*>)/)
    .map((part) => {
      if (part.startsWith('<')) {
        const match = /^<(\/?)([a-z0-9]+)/i.exec(part);
        if (match && KEEP.has((match[2] ?? '').toLowerCase()) && !part.endsWith('/>')) {
          keepDepth = Math.max(0, keepDepth + (match[1] ? -1 : 1));
        }
        return part;
      }
      if (keepDepth > 0) return part;
      return part.replace(/&#?[a-z0-9]+;|[^&]+|&/gi, (piece) =>
        piece.startsWith('&') ? piece : toDigits(piece, system),
      );
    })
    .join('');
}

/**
 * The resume as it is drawn with `layout.digits`: names, titles, dates and
 * descriptions use the chosen digits. Email, phone, web addresses and links
 * stay exactly as typed, so they keep working. Without a setting the
 * document is returned unchanged.
 */
export function applyDigits(doc: ResumeDocument): ResumeDocument {
  const system = doc.layout.digits;
  if (!system) return doc;
  const plain = (value: string) => toDigits(value, system);
  return {
    ...doc,
    profile: {
      ...doc.profile,
      fullName: plain(doc.profile.fullName),
      headline: plain(doc.profile.headline),
      location: plain(doc.profile.location),
      summaryHtml: htmlToDigits(doc.profile.summaryHtml, system),
    },
    sections: doc.sections.map((section) => ({
      ...section,
      title: plain(section.title),
      items: section.items.map((item) => ({
        ...item,
        title: plain(item.title),
        subtitle: plain(item.subtitle),
        dateRange: plain(item.dateRange),
        location: plain(item.location),
        descriptionHtml: htmlToDigits(item.descriptionHtml, system),
      })),
    })),
  };
}

export function isDigitSystem(value: string): value is DigitSystem {
  return (DIGIT_SYSTEMS as readonly string[]).includes(value);
}
