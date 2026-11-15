import { describe, expect, it } from 'vitest';

import { createBlankResume } from '@/lib/resume-factory';
import { createResumeFromSample } from '@/samples';

import { describeStorageError, ResumeValidationError } from './errors';
import { createMemoryStore } from './key-value';
import { createResumeRepository } from './repository';

describe('resume repository', () => {
  it('saves, lists, gets and removes resumes', async () => {
    const repo = createResumeRepository(createMemoryStore());
    const doc = createResumeFromSample('tech');

    await repo.save(doc);
    expect((await repo.list()).resumes).toEqual([doc]);
    expect(await repo.get(doc.id)).toEqual(doc);

    await repo.remove(doc.id);
    expect((await repo.list()).resumes).toEqual([]);
    expect(await repo.get(doc.id)).toBeUndefined();
  });

  it('refuses to write invalid data', async () => {
    const store = createMemoryStore();
    const repo = createResumeRepository(store);
    const bad = { ...createBlankResume('x'), name: '' };

    await expect(repo.save(bad)).rejects.toBeInstanceOf(ResumeValidationError);
    expect(await store.entries()).toEqual([]);
  });

  it('reports unreadable entries without deleting them', async () => {
    const good = createBlankResume('good');
    const store = createMemoryStore([
      [`resume:${good.id}`, good],
      ['resume:broken', { schemaVersion: 1, id: 'broken' }],
      ['resume:future', { schemaVersion: 42 }],
    ]);
    const repo = createResumeRepository(store);

    const { resumes, invalid } = await repo.list();
    expect(resumes.map((r) => r.id)).toEqual([good.id]);
    expect(invalid.map((i) => i.key).sort()).toEqual(['resume:broken', 'resume:future']);
    expect(invalid.find((i) => i.key === 'resume:future')?.reason).toMatch(/newer version/);
    expect(await store.entries()).toHaveLength(3);
  });

  it('ignores keys that do not belong to resumes', async () => {
    const repo = createResumeRepository(createMemoryStore([['settings', { theme: 'dark' }]]));
    expect(await repo.list()).toEqual({ resumes: [], invalid: [] });
  });

  it('clears everything', async () => {
    const repo = createResumeRepository(createMemoryStore());
    await repo.save(createBlankResume('a'));
    await repo.save(createBlankResume('b'));
    await repo.clear();
    expect((await repo.list()).resumes).toEqual([]);
  });
});

describe('describeStorageError', () => {
  it('explains a full disk', () => {
    expect(describeStorageError(new DOMException('full', 'QuotaExceededError'))).toMatch(/storage is full/);
  });

  it('prefixes validation errors', () => {
    expect(describeStorageError(new ResumeValidationError('name: required'))).toBe('Not saved: name: required');
  });
});
