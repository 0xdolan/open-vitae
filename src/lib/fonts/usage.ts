import type { ResumeDocument, TextStyle } from '@/schema/resume';

/** The first family named in a CSS font-family value, without quotes. */
function firstFamily(value: string): string | null {
  const first = value
    .split(',')[0]
    ?.trim()
    .replace(/^["']|["']$/g, '')
    .trim();
  return first ? first : null;
}

const GENERIC = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'system-ui',
  'cursive',
  'fantasy',
  'ui-monospace',
]);

/** Every font family a resume uses: page font, per-text styles and fonts inside rich text. */
export function fontsUsedBy(doc: ResumeDocument): string[] {
  const used = new Set<string>([doc.layout.fontFamily]);
  const addStyle = (style: TextStyle | undefined) => {
    if (style?.fontFamily) used.add(style.fontFamily);
  };
  const addHtml = (html: string) => {
    // Inside a style attribute, quotes around family names are stored as &quot;.
    const text = html.replace(/&quot;|&#39;/g, "'");
    for (const match of text.matchAll(/font-family:\s*([^;"]+)/gi)) {
      const family = firstFamily(match[1] ?? '');
      if (family) used.add(family);
    }
  };

  addStyle(doc.profile.nameStyle);
  addStyle(doc.profile.headlineStyle);
  addHtml(doc.profile.summaryHtml);
  for (const section of doc.sections) {
    addStyle(section.titleStyle);
    addStyle(section.descriptionStyle);
    for (const item of section.items) {
      addStyle(item.titleStyle);
      addStyle(item.descriptionStyle);
      addHtml(item.descriptionHtml);
    }
  }
  return [...used].filter((family) => !GENERIC.has(family.toLowerCase()));
}
