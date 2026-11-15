import type { ItemInput, ProfileInput, ResumeInput, SectionInput } from '@/lib/resume-factory';
import type { ResumeDocument } from '@/schema/resume';

import { htmlToMarkdown, markdownToHtml } from './markdown';
import { guessSectionKind } from './section-kind';

/**
 * A whole resume as Markdown, and back. The layout the reader understands:
 *
 *   # Full name
 *   Headline
 *   email · phone · location · [GitHub](https://…)
 *
 *   Summary paragraphs…
 *
 *   ## Section heading
 *   ### Entry title
 *   *Subtitle · Location · 2020 – Present*
 *   Description: paragraphs and lists…
 *
 * Sections without ### entries become one entry per list item ("Label: text"
 * becomes a title and description), or a single entry holding the text.
 * Browser only.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s().-]{7,}$/;
const URL_LIKE = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i;
/** "2019 – 2022", "Jan 2020 - Present", "2021", "٢٠٢١ – ئێستا" and similar. */
const DATE_RANGE =
  /((?:[\p{L}]{3,10}\.?\s)?[\d٠-٩۰-۹]{4}\s*[–—-]\s*(?:(?:[\p{L}]{3,10}\.?\s)?[\d٠-٩۰-۹]{4}|[\p{L}][\p{L}\s]{1,14})|(?:^|\s)[\d٠-٩۰-۹]{4}(?!\s*[–—-])(?=$|[\s,)]))/u;
const SEPARATORS = /\s+[·•|—]\s+|\s+-\s+/;

const KNOWN_SITES: Readonly<Record<string, string>> = {
  'github.com': 'GitHub',
  'gitlab.com': 'GitLab',
  'linkedin.com': 'LinkedIn',
  'x.com': 'X',
  'twitter.com': 'X',
  'behance.net': 'Behance',
  'dribbble.com': 'Dribbble',
  'medium.com': 'Medium',
  'stackoverflow.com': 'Stack Overflow',
};

function withProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function siteLabel(url: string): string {
  try {
    const host = new URL(withProtocol(url)).hostname.replace(/^www\./, '');
    return KNOWN_SITES[host] ?? host;
  } catch {
    return url;
  }
}

/** Pull a date range out of a line; returns the range and the rest. */
export function splitDateRange(text: string): { dateRange: string; rest: string } {
  const match = DATE_RANGE.exec(text);
  if (!match?.[0]) return { dateRange: '', rest: text.trim() };
  const dateRange = match[0].trim();
  const rest = (text.slice(0, match.index) + text.slice(match.index + match[0].length))
    .replace(/[(),\s·•|—-]+$/u, '')
    .replace(/^[(),\s·•|—-]+/u, '')
    .replace(/\(\s*\)/g, '')
    .trim();
  return { dateRange, rest };
}

/**
 * Read a contact line ("email · phone · city · github.com/me"). Changes
 * nothing and returns false unless it holds an email, phone or link, so a
 * headline with separators is not mistaken for contacts.
 */
function parseContacts(element: Element, profile: Record<string, string>, links: { label: string; url: string }[]): boolean {
  const anchors = Array.from(element.querySelectorAll('a'));
  const text = element.textContent ?? '';
  const parts = text.split(/\s*[·•|\n]\s*|\s{2,}/).map((p) => p.trim()).filter(Boolean);
  const found: Record<string, string> = {};
  const foundLinks: { label: string; url: string }[] = [];
  const other: string[] = [];
  for (const part of parts) {
    const anchor = anchors.find((a) => (a.textContent ?? '').trim() === part);
    const href = anchor?.getAttribute('href') ?? '';
    const bareUrl = !href || href.replace(/^https?:\/\//i, '').replace(/\/$/, '') === part.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    if (EMAIL.test(part) || href.startsWith('mailto:')) {
      found.email ??= href.startsWith('mailto:') ? href.slice(7) : part;
    } else if (PHONE.test(part) && /\d{3}/.test(part)) {
      found.phone ??= part;
    } else if (href && /^https?:/i.test(href) && !bareUrl) {
      foundLinks.push({ label: part, url: href });
    } else if (URL_LIKE.test(part) || (href && /^https?:/i.test(href))) {
      const url = withProtocol(href || part);
      const host = new URL(url).hostname.replace(/^www\./, '');
      if (KNOWN_SITES[host]) foundLinks.push({ label: KNOWN_SITES[host] ?? host, url });
      else found.website ??= url;
    } else {
      other.push(part);
    }
  }
  if (Object.keys(found).length === 0 && foundLinks.length === 0) return false;
  for (const [field, value] of Object.entries(found)) profile[field] ??= value;
  if (other[0]) profile.location ??= other.join(', ');
  links.push(...foundLinks);
  return true;
}

function outer(nodes: readonly Element[]): string {
  return nodes.map((node) => node.outerHTML).join('');
}

function itemsFromLooseBlocks(blocks: readonly Element[]): ItemInput[] {
  const lists = blocks.filter((b) => b.tagName === 'UL' || b.tagName === 'OL');
  if (lists.length > 0 && lists.length === blocks.length) {
    return lists.flatMap((list) =>
      Array.from(list.children).map((li) => {
        const text = (li.textContent ?? '').trim();
        const colon = text.indexOf(':');
        if (colon > 0 && colon < 50) {
          return { title: text.slice(0, colon).trim(), descriptionHtml: `<p>${escapeHtml(text.slice(colon + 1).trim())}</p>` };
        }
        const { dateRange, rest } = splitDateRange(text);
        return { title: rest, dateRange };
      }),
    );
  }
  return blocks.length > 0 ? [{ descriptionHtml: outer(blocks) }] : [];
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Read a Markdown resume. */
export function markdownToResume(markdown: string, fallbackName: string): ResumeInput {
  const template = document.createElement('template');
  template.innerHTML = markdownToHtml(markdown);
  const blocks = Array.from(template.content.children);

  const profile: Record<string, string> = {};
  const links: { label: string; url: string }[] = [];
  const sections: SectionInput[] = [];
  const intro: Element[] = [];
  let index = 0;

  // Everything before the first ## is the header: name, headline, contacts, summary.
  for (; index < blocks.length && blocks[index]?.tagName !== 'H2'; index += 1) {
    const block = blocks[index] as Element;
    if (block.tagName === 'H1' && !profile.fullName) profile.fullName = (block.textContent ?? '').trim();
    else intro.push(block);
  }
  const summary: Element[] = [];
  for (const block of intro) {
    const text = (block.textContent ?? '').trim();
    if (block.tagName === 'P' && parseContacts(block, profile, links)) continue;
    if (block.tagName === 'P' && !profile.headline && text.length <= 120 && summary.length === 0) {
      profile.headline = text;
      continue;
    }
    summary.push(block);
  }
  if (summary.length > 0) profile.summaryHtml = outer(summary);

  // Sections.
  while (index < blocks.length) {
    const heading = blocks[index] as Element;
    index += 1;
    const title = (heading.textContent ?? '').trim();
    const content: Element[] = [];
    while (index < blocks.length && blocks[index]?.tagName !== 'H2') {
      content.push(blocks[index] as Element);
      index += 1;
    }

    const items: ItemInput[] = [];
    const loose: Element[] = [];
    let current: { title: string; subtitle: string; dateRange: string; location: string; url: string; body: Element[] } | null = null;
    const flush = () => {
      if (current) {
        items.push({
          title: current.title,
          subtitle: current.subtitle,
          dateRange: current.dateRange,
          location: current.location,
          url: current.url,
          descriptionHtml: outer(current.body),
        });
      }
    };
    for (const block of content) {
      if (block.tagName === 'H3') {
        flush();
        const link = block.querySelector('a')?.getAttribute('href') ?? '';
        const { dateRange, rest } = splitDateRange((block.textContent ?? '').trim());
        const [first = rest, ...others] = rest.split(/\s+(?:—|–|\||at|@)\s+/);
        current = { title: first.trim(), subtitle: others.join(' · ').trim(), dateRange, location: '', url: /^https?:/i.test(link) ? link : '', body: [] };
        continue;
      }
      if (current && current.body.length === 0 && block.tagName === 'P' && (block.querySelector('em') || DATE_RANGE.test(block.textContent ?? ''))) {
        // The line under an entry title: "Company · City · 2020 – Present".
        const { dateRange, rest } = splitDateRange((block.textContent ?? '').trim());
        const parts = rest.split(SEPARATORS).map((p) => p.trim()).filter(Boolean);
        current.dateRange ||= dateRange;
        if (!current.subtitle) current.subtitle = parts[0] ?? '';
        else if (parts[0]) parts.unshift(current.subtitle);
        current.location = parts.slice(1).join(' · ');
        continue;
      }
      if (current) current.body.push(block);
      else loose.push(block);
    }
    flush();
    sections.push({ kind: guessSectionKind(title), title, items: [...itemsFromLooseBlocks(loose), ...items] });
  }

  const profileInput: ProfileInput = { ...profile, links };
  return { name: profile.fullName || fallbackName, profile: profileInput, sections };
}

/** Write a resume as Markdown that markdownToResume reads back. */
export function resumeToMarkdown(doc: ResumeDocument): string {
  const { profile } = doc;
  const out: string[] = [];
  if (profile.fullName) out.push(`# ${profile.fullName}`);
  if (profile.headline) out.push(profile.headline);
  const contacts = [
    profile.email,
    profile.phone,
    profile.location,
    profile.website,
    ...profile.links.filter((l) => l.url).map((l) => `[${l.label || siteLabel(l.url)}](${l.url})`),
  ].filter(Boolean);
  if (contacts.length > 0) out.push(contacts.join(' · '));
  const summary = htmlToMarkdown(profile.summaryHtml, { images: true });
  if (summary) out.push(summary);

  for (const section of doc.sections.filter((s) => s.visible)) {
    out.push(`## ${section.title}`);
    for (const item of section.items.filter((i) => i.visible)) {
      if (item.title) out.push(`### ${item.url ? `[${item.title}](${item.url})` : item.title}`);
      const meta = [item.subtitle, item.location, item.dateRange].filter(Boolean).join(' · ');
      if (meta) out.push(`*${meta}*`);
      const body = htmlToMarkdown(item.descriptionHtml, { images: true });
      if (body) out.push(body);
    }
  }
  return `${out.join('\n\n')}\n`;
}
