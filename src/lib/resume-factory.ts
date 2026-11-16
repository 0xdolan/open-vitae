import { DEFAULT_FONT_BY_DIRECTION, type TextDirection } from '@/config/fonts';
import { DEFAULT_INDENT_CH } from '@/config/layout';
import { DEFAULT_PAGE_SIZE } from '@/config/page-sizes';
import { defaultSectionTitle, type SectionKind } from '@/config/sections';
import { createId } from '@/lib/id';
import {
  RESUME_SCHEMA_VERSION,
  resumeSchema,
  type Profile,
  type ProfileLink,
  type ResumeDocument,
  type ResumeItem,
  type ResumeLayout,
  type ResumePhoto,
  type ResumeSection,
} from '@/schema/resume';

export const DEFAULT_LAYOUT: ResumeLayout = {
  pageSize: DEFAULT_PAGE_SIZE,
  orientation: 'portrait',
  marginMm: 16,
  pageBreaks: 'smart',
  direction: 'ltr',
  fontFamily: DEFAULT_FONT_BY_DIRECTION.ltr,
  baseFontSizePt: 10,
  lineHeight: 1.4,
  accentColor: '#14532d',
  indentCh: DEFAULT_INDENT_CH,
  maxDepth: null,
};

/** Item content without an id; every text field is optional. */
export type ItemInput = Partial<Omit<ResumeItem, 'id'>>;

export interface SectionInput extends Partial<Omit<ResumeSection, 'id' | 'kind' | 'items'>> {
  readonly kind: SectionKind;
  readonly items?: readonly ItemInput[];
}

export interface ProfileInput extends Partial<Omit<Profile, 'links'>> {
  readonly links?: readonly Omit<ProfileLink, 'id'>[];
}

/** Everything needed to build a resume, without ids or timestamps. */
export interface ResumeInput {
  readonly name: string;
  readonly language?: string;
  readonly layout?: Partial<ResumeLayout>;
  readonly profile?: ProfileInput;
  readonly photo?: ResumePhoto;
  readonly sections?: readonly SectionInput[];
}

function buildItem(input: ItemInput): ResumeItem {
  return {
    ...input,
    id: createId(),
    visible: input.visible ?? true,
    title: input.title ?? '',
    subtitle: input.subtitle ?? '',
    dateRange: input.dateRange ?? '',
    location: input.location ?? '',
    url: input.url ?? '',
    descriptionHtml: input.descriptionHtml ?? '',
  };
}

function buildSection(input: SectionInput, language: string): ResumeSection {
  return {
    ...input,
    id: createId(),
    title: input.title ?? defaultSectionTitle(input.kind, language),
    visible: input.visible ?? true,
    breakBefore: input.breakBefore ?? false,
    items: (input.items ?? []).map(buildItem),
  };
}

function buildProfile(input: ProfileInput = {}): Profile {
  return {
    ...input,
    fullName: input.fullName ?? '',
    headline: input.headline ?? '',
    email: input.email ?? '',
    phone: input.phone ?? '',
    location: input.location ?? '',
    website: input.website ?? '',
    summaryHtml: input.summaryHtml ?? '',
    links: (input.links ?? []).map((link) => ({ ...link, id: createId() })),
  };
}

/**
 * Build a complete, validated resume from partial input. Assigns fresh ids and
 * timestamps. Throws if the result does not match the schema.
 */
export function buildResume(input: ResumeInput, now: Date = new Date()): ResumeDocument {
  const direction = input.layout?.direction ?? DEFAULT_LAYOUT.direction;
  const language = input.language ?? (direction === 'rtl' ? 'fa' : 'en');
  const timestamp = now.toISOString();

  return resumeSchema.parse({
    schemaVersion: RESUME_SCHEMA_VERSION,
    id: createId(),
    name: input.name,
    language,
    createdAt: timestamp,
    updatedAt: timestamp,
    layout: {
      ...DEFAULT_LAYOUT,
      fontFamily: DEFAULT_FONT_BY_DIRECTION[direction],
      ...input.layout,
    },
    profile: buildProfile(input.profile),
    photo: input.photo,
    sections: (input.sections ?? []).map((section) => buildSection(section, language)),
  });
}

const BLANK_SECTIONS: readonly SectionKind[] = ['experience', 'education', 'skills'];

export function createBlankResume(
  name: string,
  direction: TextDirection = 'ltr',
  now: Date = new Date(),
): ResumeDocument {
  return buildResume(
    {
      name,
      layout: { direction },
      sections: BLANK_SECTIONS.map((kind) => ({ kind })),
    },
    now,
  );
}

/** Deep copy with new ids for the document and everything inside it. */
export function cloneResume(
  doc: ResumeDocument,
  name: string,
  now: Date = new Date(),
): ResumeDocument {
  const copy = structuredClone(doc);
  const timestamp = now.toISOString();
  return {
    ...copy,
    id: createId(),
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    profile: {
      ...copy.profile,
      links: copy.profile.links.map((link) => ({ ...link, id: createId() })),
    },
    sections: copy.sections.map((section) => ({
      ...section,
      id: createId(),
      items: section.items.map((item) => ({ ...item, id: createId() })),
    })),
  };
}

export function touch(doc: ResumeDocument, now: Date = new Date()): ResumeDocument {
  return { ...doc, updatedAt: now.toISOString() };
}

/** "Name", or "Name (2)", "Name (3)"... if that name is taken. */
export function uniqueName(base: string, existing: Iterable<string>): string {
  const taken = new Set(existing);
  if (!taken.has(base)) {
    return base;
  }
  let n = 2;
  while (taken.has(`${base} (${n})`)) {
    n += 1;
  }
  return `${base} (${n})`;
}

/** Most recently edited first. */
export function sortByUpdated(docs: Iterable<ResumeDocument>): ResumeDocument[] {
  return [...docs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
