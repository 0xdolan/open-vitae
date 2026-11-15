import { describe, expect, it } from 'vitest';

import { createBlankResume } from '@/lib/resume-factory';
import {
  createMemoryPreferences,
  createMemoryStore,
  createResumeRepository,
  type SyncChannel,
  type SyncMessage,
} from '@/lib/storage';

import { createResumeStore } from './resume-store';

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
  const repository = createResumeRepository(createMemoryStore());
  const preferences = createMemoryPreferences();
  const store = createResumeStore({ repository, preferences, autosaveDelayMs: options.delay ?? 10_000 });
  return { store, repository, preferences };
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
    const repository = createResumeRepository(createMemoryStore());
    const channel = createBus();
    const make = () =>
      createResumeStore({
        repository,
        preferences: createMemoryPreferences(),
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
});
