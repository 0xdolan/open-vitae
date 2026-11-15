import { describe, expect, it } from 'vitest';

import { LIMITS } from '@/config/layout';
import { createBlankResume } from '@/lib/resume-factory';
import { createResumeFromSample } from '@/samples';
import { resumeSchema } from '@/schema/resume';

import {
  addItem,
  addLink,
  addSection,
  arrayMove,
  duplicateItem,
  duplicateSection,
  insertSection,
  moveItem,
  moveLink,
  moveSection,
  removeItem,
  removeLink,
  removeSection,
  updateItem,
  updateLink,
  updateProfile,
  updateSection,
} from './document-ops';

const kinds = (doc: { sections: readonly { kind: string }[] }) => doc.sections.map((s) => s.kind);

describe('arrayMove', () => {
  it('moves forwards, backwards and clamps', () => {
    expect(arrayMove(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(arrayMove(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(arrayMove(['a', 'b', 'c'], 0, 99)).toEqual(['b', 'c', 'a']);
    expect(arrayMove(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
  });

  it('never mutates the input', () => {
    const list = ['a', 'b'];
    arrayMove(list, 0, 1);
    expect(list).toEqual(['a', 'b']);
  });
});

describe('sections', () => {
  it('reorders sections, which is the order on the page', () => {
    const doc = createBlankResume('x');
    expect(kinds(moveSection(doc, 2, 0))).toEqual(['skills', 'experience', 'education']);
  });

  it('adds a section with a title in the resume language', () => {
    const { doc, sectionId } = addSection(createBlankResume('x', 'rtl'), 'projects');
    expect(doc.sections.at(-1)).toMatchObject({ id: sectionId, kind: 'projects', title: 'پروژه‌ها', items: [] });
    expect(resumeSchema.safeParse(doc).success).toBe(true);
  });

  it('refuses to add beyond the limit', () => {
    let doc = createBlankResume('x');
    while (doc.sections.length < LIMITS.sections) doc = addSection(doc, 'custom').doc;
    const result = addSection(doc, 'custom');
    expect(result.sectionId).toBeNull();
    expect(result.doc).toBe(doc);
  });

  it('updates, hides, removes and re-inserts a section', () => {
    const doc = createBlankResume('x');
    const id = doc.sections[1]?.id ?? '';
    const hidden = updateSection(doc, id, { visible: false, title: 'Studies' });
    expect(hidden.sections[1]).toMatchObject({ visible: false, title: 'Studies' });

    const removed = removeSection(hidden, id);
    expect(kinds(removed)).toEqual(['experience', 'skills']);
    const restored = insertSection(removed, hidden.sections[1]!, 1);
    expect(restored.sections.map((s) => s.title)).toEqual(['Experience', 'Studies', 'Skills']);
    expect(insertSection(restored, hidden.sections[1]!, 0)).toBe(restored);
  });

  it('duplicates a section right after the original with new ids', () => {
    const doc = createResumeFromSample('tech');
    const source = doc.sections[0]!;
    const { doc: next, sectionId } = duplicateSection(doc, source.id);
    const copy = next.sections[1]!;
    expect(copy.id).toBe(sectionId);
    expect(copy.title).toBe(source.title);
    expect(copy.items.map((i) => i.title)).toEqual(source.items.map((i) => i.title));
    expect(copy.items.some((i, n) => i.id === source.items[n]?.id)).toBe(false);
    expect(resumeSchema.safeParse(next).success).toBe(true);
  });
});

describe('items', () => {
  it('adds, edits, duplicates, moves and removes entries', () => {
    const base = createBlankResume('x');
    const sectionId = base.sections[0]!.id;

    const added = addItem(base, sectionId);
    const itemId = added.itemId ?? '';
    const edited = updateItem(added.doc, sectionId, itemId, { title: 'Engineer', visible: false });
    expect(edited.sections[0]!.items[0]).toMatchObject({ title: 'Engineer', visible: false, descriptionHtml: '' });

    const duplicated = duplicateItem(edited, sectionId, itemId);
    expect(duplicated.doc.sections[0]!.items).toHaveLength(2);
    expect(duplicated.itemId).not.toBe(itemId);

    const second = addItem(duplicated.doc, sectionId);
    const renamed = updateItem(second.doc, sectionId, second.itemId ?? '', { title: 'Last' });
    const moved = moveItem(renamed, sectionId, 2, 0);
    expect(moved.sections[0]!.items[0]?.title).toBe('Last');

    const removed = removeItem(moved, sectionId, itemId);
    expect(removed.sections[0]!.items).toHaveLength(2);
    expect(resumeSchema.safeParse(removed).success).toBe(true);
  });

  it('does nothing for unknown sections', () => {
    const doc = createBlankResume('x');
    expect(addItem(doc, 'nope')).toEqual({ doc, itemId: null });
  });
});

describe('profile and links', () => {
  it('updates profile fields', () => {
    const doc = updateProfile(createBlankResume('x'), { fullName: 'Ava', email: 'ava@example.com' });
    expect(doc.profile).toMatchObject({ fullName: 'Ava', email: 'ava@example.com' });
  });

  it('adds an empty link that still saves, then edits, moves and removes links', () => {
    const one = addLink(createBlankResume('x'));
    expect(resumeSchema.safeParse(one.doc).success).toBe(true);

    const filled = updateLink(one.doc, one.linkId ?? '', { label: 'GitHub', url: 'https://example.com/me' });
    const two = addLink(filled);
    const labelled = updateLink(two.doc, two.linkId ?? '', { label: 'Blog' });
    expect(moveLink(labelled, 1, 0).profile.links.map((l) => l.label)).toEqual(['Blog', 'GitHub']);
    expect(removeLink(labelled, one.linkId ?? '').profile.links.map((l) => l.label)).toEqual(['Blog']);
  });
});
