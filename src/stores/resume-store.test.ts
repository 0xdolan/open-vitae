import { describe, expect, it } from 'vitest';

import { createBlankResume } from '@/lib/resume-factory';
import {
  createMemoryPreferences,
  createMemoryStore,
  createResumeRepository,
  type SyncChannel,
  type SyncMessage,
} from '@/lib/storage';

import { createVersionRepository } from '@/lib/versions/repository';

import { createResumeStore, type ResumeStoreDeps } from './resume-store';

type Download = { fileName: string; content: string; mimeType: string };

/** Two stores connected by an in-memory channel behave like two browser tabs. */
function createBus() {
  const listeners = new Set<(m: SyncMessage) => void>();
  return (): SyncChannel => {
    let own: ((m: SyncMessage) => void) | undefined;
    return {
      post: (message) => listeners.forEach((l) => l !== own && l(message)),
      subscribe(listener) {
        own = listener;
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
  };
}

function setup(options: { delay?: number } = {}) {
  const kv = createMemoryStore();
  const repository = createResumeRepository(kv);
  const versions = createVersionRepository(kv);
  const preferences = createMemoryPreferences();
  const downloads: Download[] = [];
  const deps: ResumeStoreDeps = {
    repository,
    versions,
    preferences,
    download: (fileName, content, mimeType) => {
      downloads.push({ fileName, content: String(content), mimeType });
    },
    autosaveDelayMs: options.delay ?? 10_000,
    appVersion: '9.9.9',
  };
  const store = createResumeStore(deps);
  return { store, repository, versions, preferences, downloads };
}

const tick = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('resume store', () => {
  it('starts empty and ready', async () => {
    const { store } = setup();
    await store.getState().init();
    expect(store.getState()).toMatchObject({ status: 'ready', activeId: null, resumes: {} });
  });

  it('restores the last active resume', async () => {
    const { store, repository, preferences } = setup();
    const a = await repository.save(createBlankResume('a', 'ltr', new Date('2026-01-01T00:00:00Z')));
    await repository.save(createBlankResume('b', 'ltr', new Date('2026-02-01T00:00:00Z')));
    preferences.setActiveId(a.id);
    await store.getState().init();
    expect(store.getState().activeId).toBe(a.id);
  });

  it('creates a resume from a sample, saves it and opens it', async () => {
    const { store, repository } = setup();
    await store.getState().init();
    const doc = await store.getState().createFromSample('cybersecurity');
    expect(doc?.profile.fullName).toBe('Leyla Hassan');
    expect(store.getState().activeId).toBe(doc?.id);
    expect((await repository.list()).resumes).toHaveLength(1);
  });

  it('gives copies of the same sample different names', async () => {
    const { store } = setup();
    await store.getState().init();
    const a = await store.getState().createFromSample('tech');
    const b = await store.getState().createFromSample('tech');
    expect(b?.name).toBe(`${a?.name ?? ''} (2)`);
  });

  it('keeps edits in memory until flushed, then writes them', async () => {
    const { store, repository } = setup();
    await store.getState().init();
    const doc = await store.getState().createBlank();
    store.getState().updateActive((d) => ({ ...d, name: 'Edited' }));

    expect(store.getState().saveState).toBe('unsaved');
    expect((await repository.get(doc?.id ?? ''))?.name).not.toBe('Edited');

    await store.getState().flush();
    expect(store.getState().saveState).toBe('saved');
    expect((await repository.get(doc?.id ?? ''))?.name).toBe('Edited');
  });

  it('autosaves after the delay', async () => {
    const { store, repository } = setup({ delay: 5 });
    await store.getState().init();
    const doc = await store.getState().createBlank();
    store.getState().updateActive((d) => ({ ...d, name: 'Autosaved' }));
    await tick(40);
    expect((await repository.get(doc?.id ?? ''))?.name).toBe('Autosaved');
  });

  it('reports invalid edits and keeps them for the next attempt', async () => {
    const { store, repository } = setup();
    await store.getState().init();
    const doc = await store.getState().createBlank();
    store.getState().updateActive((d) => ({ ...d, name: '' }));
    await store.getState().flush();

    expect(store.getState().saveState).toBe('error');
    expect(store.getState().message).toMatch(/Not saved/);
    expect((await repository.get(doc?.id ?? ''))?.name).toBe('Untitled resume');

    store.getState().updateActive((d) => ({ ...d, name: 'Fixed' }));
    await store.getState().flush();
    expect(store.getState().saveState).toBe('saved');
    expect((await repository.get(doc?.id ?? ''))?.name).toBe('Fixed');
  });

  it('duplicates with new ids and a copy name', async () => {
    const { store } = setup();
    await store.getState().init();
    const original = await store.getState().createFromSample('finance');
    const copy = await store.getState().duplicate(original?.id ?? '');
    expect(copy?.id).not.toBe(original?.id);
    expect(copy?.name).toBe(`${original?.name ?? ''} (copy)`);
    expect(store.getState().activeId).toBe(copy?.id);
  });

  it('removes a resume and opens the next most recent one', async () => {
    const { store, repository } = setup();
    await store.getState().init();
    const first = await store.getState().createBlank();
    const second = await store.getState().createBlank();
    await store.getState().remove(second?.id ?? '');
    expect(store.getState().activeId).toBe(first?.id);
    expect(await repository.get(second?.id ?? '')).toBeUndefined();
  });

  it('clears everything', async () => {
    const { store, repository, preferences } = setup();
    await store.getState().init();
    await store.getState().createFromSample('cloud');
    await store.getState().clearAll();
    expect(store.getState()).toMatchObject({ resumes: {}, activeId: null });
    expect((await repository.list()).resumes).toEqual([]);
    expect(preferences.getActiveId()).toBeNull();
  });

  it('picks up changes saved in another tab', async () => {
    const kv = createMemoryStore();
    const repository = createResumeRepository(kv);
    const channel = createBus();
    const make = () =>
      createResumeStore({
        repository,
        versions: createVersionRepository(kv),
        preferences: createMemoryPreferences(),
        download: () => undefined,
        sync: channel(),
        autosaveDelayMs: 10_000,
      });
    const tabA = make();
    const tabB = make();
    await tabA.getState().init();
    await tabB.getState().init();

    const doc = await tabA.getState().createBlank();
    await tick(0);
    expect(tabB.getState().resumes[doc?.id ?? '']).toBeDefined();

    tabA.getState().updateActive((d) => ({ ...d, name: 'From tab A' }));
    await tabA.getState().flush();
    await tick(0);
    expect(tabB.getState().resumes[doc?.id ?? '']?.name).toBe('From tab A');

    await tabA.getState().remove(doc?.id ?? '');
    await tick(0);
    expect(tabB.getState().resumes[doc?.id ?? '']).toBeUndefined();
  });

  describe('versions', () => {
    it('records a version for every save that changes something', async () => {
      const { store } = setup();
      await store.getState().init();
      await store.getState().createBlank();
      expect(store.getState().versions.map((v) => v.reason)).toEqual(['created']);

      store.getState().updateActive((d) => ({ ...d, name: 'One' }));
      await store.getState().flush();
      store.getState().updateActive((d) => ({ ...d, name: 'Two' }));
      await store.getState().flush();

      const list = store.getState().versions;
      expect(list.map((v) => v.number)).toEqual([3, 2, 1]);
      expect(list.every((v) => !Number.isNaN(Date.parse(v.savedAt)))).toBe(true);
    });

    it('does not add a version when a save changes nothing', async () => {
      const { store } = setup();
      await store.getState().init();
      await store.getState().createBlank();
      store.getState().updateActive((d) => ({ ...d }));
      await store.getState().flush();
      expect(store.getState().versions).toHaveLength(1);
    });

    it('saves a named version on request', async () => {
      const { store } = setup();
      await store.getState().init();
      await store.getState().createBlank();
      const named = await store.getState().saveNamedVersion('  Sent to Acme  ');
      expect(named).toMatchObject({ number: 2, note: 'Sent to Acme', reason: 'manual' });
    });

    it('restores an older version and keeps the newer one in history', async () => {
      const { store, repository } = setup();
      await store.getState().init();
      const doc = await store.getState().createBlank();
      store.getState().updateActive((d) => ({ ...d, name: 'Newer' }));
      await store.getState().flush();

      const first = store.getState().versions.at(-1);
      const restored = await store.getState().restoreVersion(first?.id ?? '');

      expect(restored).toMatchObject({ number: 3, reason: 'restore', note: 'Restored from version 1' });
      expect(store.getState().resumes[doc?.id ?? '']?.name).toBe('Untitled resume');
      expect((await repository.get(doc?.id ?? ''))?.name).toBe('Untitled resume');
      expect(store.getState().versions.map((v) => v.number)).toEqual([3, 2, 1]);
    });

    it('keeps all versions by default and prunes when the person chooses a limit', async () => {
      const { store, preferences } = setup();
      await store.getState().init();
      expect(store.getState().retention).toBe('all');

      await store.getState().createBlank();
      for (let i = 0; i < 25; i++) {
        store.getState().updateActive((d) => ({ ...d, name: `Name ${i}` }));
        await store.getState().flush();
      }
      expect(store.getState().versions).toHaveLength(26);

      await store.getState().setRetention(20);
      expect(preferences.getRetention()).toBe(20);
      expect(store.getState().versions).toHaveLength(20);
      expect(store.getState().versions[0]?.number).toBe(26);
    });

    it('removes versions together with their resume', async () => {
      const { store, versions } = setup();
      await store.getState().init();
      const doc = await store.getState().createBlank();
      await store.getState().remove(doc?.id ?? '');
      expect(await versions.list(doc?.id ?? '')).toEqual([]);
    });
  });

  describe('export', () => {
    it('downloads the latest saved state with a versioned, time-stamped name', async () => {
      const { store, downloads } = setup();
      await store.getState().init();
      await store.getState().createFromSample('tech');
      store.getState().updateActive((d) => ({ ...d, name: 'Edited before export' }));

      const result = await store.getState().exportJson();

      expect(result?.version?.number).toBe(2);
      expect(downloads).toHaveLength(1);
      expect(downloads[0]?.fileName).toMatch(/^maya-okafor-v2-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/);
      const body = JSON.parse(downloads[0]?.content ?? '{}') as { app: string; resume: { name: string } };
      expect(body.app).toBe('Open Vitae 9.9.9');
      expect(body.resume.name).toBe('Edited before export');
      expect(store.getState().versions[0]?.exportedAt).not.toBeNull();
    });

    it('can export an older version', async () => {
      const { store, downloads } = setup();
      await store.getState().init();
      await store.getState().createBlank();
      store.getState().updateActive((d) => ({ ...d, name: 'Later' }));
      await store.getState().flush();
      const first = store.getState().versions.at(-1);

      await store.getState().exportJson(first?.id);
      const body = JSON.parse(downloads[0]?.content ?? '{}') as { resume: { name: string }; version: { number: number } };
      expect(body.version.number).toBe(1);
      expect(body.resume.name).toBe('Untitled resume');
    });

    it('refuses to export invalid data and says why', async () => {
      const { store, downloads } = setup();
      await store.getState().init();
      await store.getState().createBlank();
      store.getState().updateActive((d) => ({ ...d, name: '' }));
      expect(await store.getState().exportJson()).toBeNull();
      expect(downloads).toHaveLength(0);
      expect(store.getState().message).toMatch(/name/);
    });
  });
});
