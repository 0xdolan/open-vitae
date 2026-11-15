import { LIMITS } from '@/config/layout';
import { defaultSectionTitle, type SectionKind } from '@/config/sections';
import { createId } from '@/lib/id';
import type {
  Profile,
  ProfileLink,
  ResumeDocument,
  ResumeItem,
  ResumeSection,
} from '@/schema/resume';

/**
 * Pure, immutable edits to a resume. The editor calls these through the store,
 * which handles undo, saving and versions. Nothing here touches storage.
 */

/** Move one element; out-of-range targets are clamped. */
export function arrayMove<T>(list: readonly T[], from: number, to: number): T[] {
  const copy = [...list];
  if (from < 0 || from >= copy.length) return copy;
  const target = Math.max(0, Math.min(copy.length - 1, to));
  const [moved] = copy.splice(from, 1);
  copy.splice(target, 0, moved as T);
  return copy;
}

function mapSection(
  doc: ResumeDocument,
  sectionId: string,
  fn: (section: ResumeSection) => ResumeSection,
): ResumeDocument {
  return { ...doc, sections: doc.sections.map((s) => (s.id === sectionId ? fn(s) : s)) };
}

export function emptyItem(): ResumeItem {
  return {
    id: createId(),
    visible: true,
    title: '',
    subtitle: '',
    dateRange: '',
    location: '',
    url: '',
    descriptionHtml: '',
  };
}

export function createSection(kind: SectionKind, language: string): ResumeSection {
  return {
    id: createId(),
    kind,
    title: defaultSectionTitle(kind, language),
    visible: true,
    breakBefore: false,
    items: [],
  };
}

// ---------------------------------------------------------------- sections

export function moveSection(doc: ResumeDocument, from: number, to: number): ResumeDocument {
  return { ...doc, sections: arrayMove(doc.sections, from, to) };
}

export function insertSection(doc: ResumeDocument, section: ResumeSection, index: number): ResumeDocument {
  if (doc.sections.some((s) => s.id === section.id) || doc.sections.length >= LIMITS.sections) return doc;
  const sections = [...doc.sections];
  sections.splice(Math.max(0, Math.min(index, sections.length)), 0, section);
  return { ...doc, sections };
}

/** Adds a section at the end (or at `index`). Returns the new id, or null at the limit. */
export function addSection(
  doc: ResumeDocument,
  kind: SectionKind,
  index: number = doc.sections.length,
): { doc: ResumeDocument; sectionId: string | null } {
  if (doc.sections.length >= LIMITS.sections) return { doc, sectionId: null };
  const section = createSection(kind, doc.language);
  return { doc: insertSection(doc, section, index), sectionId: section.id };
}

export function updateSection(
  doc: ResumeDocument,
  sectionId: string,
  patch: Partial<Omit<ResumeSection, 'id' | 'items'>>,
): ResumeDocument {
  return mapSection(doc, sectionId, (s) => ({ ...s, ...patch }));
}

export function removeSection(doc: ResumeDocument, sectionId: string): ResumeDocument {
  return { ...doc, sections: doc.sections.filter((s) => s.id !== sectionId) };
}

/** Copy placed right after the original, with new ids for it and its items. */
export function duplicateSection(
  doc: ResumeDocument,
  sectionId: string,
): { doc: ResumeDocument; sectionId: string | null } {
  const index = doc.sections.findIndex((s) => s.id === sectionId);
  const source = doc.sections[index];
  if (!source || doc.sections.length >= LIMITS.sections) return { doc, sectionId: null };
  const copy: ResumeSection = {
    ...structuredClone(source),
    id: createId(),
    items: source.items.map((item) => ({ ...structuredClone(item), id: createId() })),
  };
  return { doc: insertSection(doc, copy, index + 1), sectionId: copy.id };
}

// ---------------------------------------------------------------- items

export function addItem(
  doc: ResumeDocument,
  sectionId: string,
): { doc: ResumeDocument; itemId: string | null } {
  const section = doc.sections.find((s) => s.id === sectionId);
  if (!section || section.items.length >= LIMITS.itemsPerSection) return { doc, itemId: null };
  const item = emptyItem();
  return {
    doc: mapSection(doc, sectionId, (s) => ({ ...s, items: [...s.items, item] })),
    itemId: item.id,
  };
}

export function updateItem(
  doc: ResumeDocument,
  sectionId: string,
  itemId: string,
  patch: Partial<Omit<ResumeItem, 'id'>>,
): ResumeDocument {
  return mapSection(doc, sectionId, (s) => ({
    ...s,
    items: s.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
  }));
}

export function removeItem(doc: ResumeDocument, sectionId: string, itemId: string): ResumeDocument {
  return mapSection(doc, sectionId, (s) => ({ ...s, items: s.items.filter((i) => i.id !== itemId) }));
}

export function duplicateItem(
  doc: ResumeDocument,
  sectionId: string,
  itemId: string,
): { doc: ResumeDocument; itemId: string | null } {
  const section = doc.sections.find((s) => s.id === sectionId);
  const index = section?.items.findIndex((i) => i.id === itemId) ?? -1;
  const source = section?.items[index];
  if (!section || !source || section.items.length >= LIMITS.itemsPerSection) {
    return { doc, itemId: null };
  }
  const copy = { ...structuredClone(source), id: createId() };
  const items = [...section.items];
  items.splice(index + 1, 0, copy);
  return { doc: mapSection(doc, sectionId, (s) => ({ ...s, items })), itemId: copy.id };
}

export function moveItem(doc: ResumeDocument, sectionId: string, from: number, to: number): ResumeDocument {
  return mapSection(doc, sectionId, (s) => ({ ...s, items: arrayMove(s.items, from, to) }));
}

// ---------------------------------------------------------------- profile

export function updateProfile(doc: ResumeDocument, patch: Partial<Omit<Profile, 'links'>>): ResumeDocument {
  return { ...doc, profile: { ...doc.profile, ...patch } };
}

export function addLink(doc: ResumeDocument): { doc: ResumeDocument; linkId: string | null } {
  if (doc.profile.links.length >= LIMITS.links) return { doc, linkId: null };
  const link: ProfileLink = { id: createId(), label: '', url: '' };
  return { doc: { ...doc, profile: { ...doc.profile, links: [...doc.profile.links, link] } }, linkId: link.id };
}

export function updateLink(
  doc: ResumeDocument,
  linkId: string,
  patch: Partial<Omit<ProfileLink, 'id'>>,
): ResumeDocument {
  return {
    ...doc,
    profile: {
      ...doc.profile,
      links: doc.profile.links.map((l) => (l.id === linkId ? { ...l, ...patch } : l)),
    },
  };
}

export function removeLink(doc: ResumeDocument, linkId: string): ResumeDocument {
  return {
    ...doc,
    profile: { ...doc.profile, links: doc.profile.links.filter((l) => l.id !== linkId) },
  };
}

export function moveLink(doc: ResumeDocument, from: number, to: number): ResumeDocument {
  return { ...doc, profile: { ...doc.profile, links: arrayMove(doc.profile.links, from, to) } };
}
