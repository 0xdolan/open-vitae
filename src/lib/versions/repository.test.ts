import { describe, expect, it } from 'vitest';

import { createBlankResume } from '@/lib/resume-factory';
import { createMemoryStore } from '@/lib/storage/key-value';
import type { ResumeDocument } from '@/schema/resume';

import { createVersionRepository } from './repository';

const at = (minute: number) => new Date(Date.UTC(2026, 10, 14, 19, minute, 0));

function setup() {
  const store = createMemoryStore();
  return { store, repo: createVersionRepository(store), doc: createBlankResume('CV') };
}

const rename = (doc: ResumeDocument, name: string): ResumeDocument => ({ ...doc, name });

describe('version repository', () => {
  it('numbers versions and lists them newest first with their save time', async () => {
    const { repo, doc } = setup();
    await repo.record(doc, { reason: 'created', now: at(1) });
    await repo.record(rename(doc, 'CV 2'), { reason: 'autosave', now: at(2) });

    const list = await repo.list(doc.id);
    expect(list.map((v) => v.number)).toEqual([2, 1]);
    expect(list[0]).toMatchObject({ reason: 'autosave', savedAt: at(2).toISOString() });
  });

  it('skips a save whose content did not change', async () => {
    const { repo, doc } = setup();
    await repo.record(doc, { reason: 'created', now: at(1) });
    const same = await repo.record({ ...doc, updatedAt: at(5).toISOString() }, { reason: 'autosave' });
    expect(same).toBeNull();
    expect(await repo.list(doc.id)).toHaveLength(1);
  });

  it('records named versions even without changes', async () => {
    const { repo, doc } = setup();
    await repo.record(doc, { reason: 'created' });
    const named = await repo.record(doc, { reason: 'manual', note: 'Sent to Acme', force: true });
    expect(named).toMatchObject({ number: 2, note: 'Sent to Acme', reason: 'manual' });
  });

  it('loads an older version exactly as it was', async () => {
    const { repo, doc } = setup();
    const v1 = await repo.record(doc, { reason: 'created' });
    await repo.record(rename(doc, 'Changed'), { reason: 'autosave' });
    const loaded = await repo.load(doc.id, v1?.id ?? '');
    expect(loaded?.name).toBe('CV');
  });

  it('stores a photo once however many versions use it', async () => {
    const { store, repo, doc } = setup();
    const photo = { dataUrl: `data:image/png;base64,${'A'.repeat(4000)}`, align: 'start', shape: 'circle', widthMm: 30 } as const;
    const withPhoto = { ...doc, photo };
    const v1 = await repo.record(withPhoto, { reason: 'created' });
    await repo.record(rename(withPhoto, 'Two'), { reason: 'autosave' });
    await repo.record(rename(withPhoto, 'Three'), { reason: 'autosave' });

    const photoKeys = (await store.keys()).filter((k) => k.startsWith('photo:'));
    expect(photoKeys).toHaveLength(1);
    expect((await repo.load(doc.id, v1?.id ?? ''))?.photo?.dataUrl).toBe(photo.dataUrl);
  });

  it('keeps the uncropped source picture once and restores it with the photo', async () => {
    const { store, repo, doc } = setup();
    const source = {
      dataUrl: `data:image/webp;base64,${'B'.repeat(6000)}`,
      width: 1200,
      height: 1600,
      crop: { x: 100, y: 200, width: 900, height: 900, rotation: 0 },
    } as const;
    const photo = { dataUrl: `data:image/jpeg;base64,${'C'.repeat(3000)}`, align: 'end', shape: 'rounded', widthMm: 32, source } as const;
    const v1 = await repo.record({ ...doc, photo }, { reason: 'created' });
    await repo.record(rename({ ...doc, photo }, 'Two'), { reason: 'autosave' });

    expect((await store.keys()).filter((k) => k.startsWith('photo:'))).toHaveLength(2);
    const loaded = await repo.load(doc.id, v1?.id ?? '');
    expect(loaded?.photo?.source).toEqual(source);
    expect(loaded?.photo?.dataUrl).toBe(photo.dataUrl);

    // Both images stay while a version refers to them.
    expect(await repo.collectGarbage()).toBe(0);
  });

  it('prunes old autosaves but keeps named versions and the latest', async () => {
    const { repo, doc } = setup();
    await repo.record(doc, { reason: 'created' });
    await repo.record(rename(doc, 'a'), { reason: 'manual', note: 'keep me', force: true });
    for (const name of ['b', 'c', 'd', 'e']) {
      await repo.record(rename(doc, name), { reason: 'autosave' });
    }
    const removed = await repo.prune(doc.id, 20);
    expect(removed).toBe(0);

    // Pretend the limit is 2 to exercise the rule on a small history.
    const removedSmall = await repo.prune(doc.id, 2 as unknown as 20);
    const left = await repo.list(doc.id);
    expect(removedSmall).toBe(4);
    expect(left.map((v) => v.note || v.number)).toEqual([6, 'keep me']);
  });

  it('never prunes when keeping all versions', async () => {
    const { repo, doc } = setup();
    for (const name of ['a', 'b', 'c']) await repo.record(rename(doc, name), { reason: 'autosave' });
    expect(await repo.prune(doc.id, 'all')).toBe(0);
    expect(await repo.list(doc.id)).toHaveLength(3);
  });

  it('marks a version as exported', async () => {
    const { repo, doc } = setup();
    const v1 = await repo.record(doc, { reason: 'created' });
    await repo.markExported(doc.id, v1?.id ?? '', at(9));
    expect((await repo.list(doc.id))[0]?.exportedAt).toBe(at(9).toISOString());
  });

  it('removes all versions of a resume and collects unused photos', async () => {
    const { store, repo, doc } = setup();
    const photo = { dataUrl: 'data:image/png;base64,QUJD', align: 'center', shape: 'square', widthMm: 25 } as const;
    await repo.record({ ...doc, photo }, { reason: 'created' });
    await repo.removeAll(doc.id);
    expect(await repo.list(doc.id)).toEqual([]);
    expect(await repo.collectGarbage()).toBe(1);
    expect(await store.keys()).toEqual([]);
  });

  it('treats a damaged index as empty instead of crashing', async () => {
    const { store, repo, doc } = setup();
    await store.set(`versions:${doc.id}`, [{ nonsense: true }]);
    expect(await repo.list(doc.id)).toEqual([]);
  });
});
