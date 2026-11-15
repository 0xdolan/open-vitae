import { create } from 'zustand';

import type { TextDirection } from '@/config/fonts';
import {
  cloneResume,
  createBlankResume,
  sortByUpdated,
  touch,
  uniqueName,
} from '@/lib/resume-factory';
import { omitKey } from '@/lib/object';
import {
  describeStorageError,
  type PreferenceStore,
  type ResumeRepository,
  type SyncChannel,
  type SyncMessage,
} from '@/lib/storage';
import { createResumeFromSample, getSample, type SampleId } from '@/samples';
import type { ResumeDocument } from '@/schema/resume';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
export type SaveState = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

export interface ResumeStoreState {
  readonly status: LoadStatus;
  readonly resumes: Readonly<Record<string, ResumeDocument>>;
  readonly activeId: string | null;
  /** Stored entries that could not be read (left untouched in storage). */
  readonly invalidCount: number;
  readonly saveState: SaveState;
  /** Last error, phrased for the person using the app. */
  readonly message: string | null;

  init(): Promise<void>;
  setActive(id: string): void;
  createBlank(direction?: TextDirection): Promise<ResumeDocument | null>;
  createFromSample(sampleId: SampleId): Promise<ResumeDocument | null>;
  duplicate(id: string): Promise<ResumeDocument | null>;
  remove(id: string): Promise<void>;
  /** Change the active resume; it is saved automatically shortly after. */
  updateActive(updater: (doc: ResumeDocument) => ResumeDocument): void;
  /** Write any pending changes now (on tab hide, before export...). */
  flush(): Promise<void>;
  clearAll(): Promise<void>;
  dismissMessage(): void;
}

export interface ResumeStoreDeps {
  readonly repository: ResumeRepository;
  readonly preferences: PreferenceStore;
  readonly sync?: SyncChannel | null;
  readonly autosaveDelayMs?: number;
  readonly now?: () => Date;
}

function mostRecentId(resumes: Readonly<Record<string, ResumeDocument>>): string | null {
  return sortByUpdated(Object.values(resumes))[0]?.id ?? null;
}

/**
 * Creates the resume store. Dependencies are injected so tests can use an
 * in-memory repository and fake timers.
 */
export function createResumeStore({
  repository,
  preferences,
  sync = null,
  autosaveDelayMs = 600,
  now = () => new Date(),
}: ResumeStoreDeps) {
  /** Edited documents waiting to be written, by id. */
  const pending = new Map<string, ResumeDocument>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  return create<ResumeStoreState>()((set, get) => {
    const names = () => Object.values(get().resumes).map((doc) => doc.name);

    const fail = (error: unknown) => {
      set({ message: describeStorageError(error) });
    };

    const activate = (id: string | null) => {
      preferences.setActiveId(id);
      set({ activeId: id });
    };

    /** Save a new document immediately and make it active. */
    const addAndActivate = async (doc: ResumeDocument): Promise<ResumeDocument | null> => {
      try {
        const saved = await repository.save(doc);
        set((state) => ({ resumes: { ...state.resumes, [saved.id]: saved }, message: null }));
        activate(saved.id);
        sync?.post({ type: 'saved', id: saved.id, updatedAt: saved.updatedAt });
        return saved;
      } catch (error) {
        fail(error);
        return null;
      }
    };

    const scheduleSave = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        void get().flush();
      }, autosaveDelayMs);
    };

    const onSyncMessage = async (message: SyncMessage) => {
      switch (message.type) {
        case 'saved': {
          // Never overwrite edits this tab has not saved yet.
          if (pending.has(message.id)) return;
          const local = get().resumes[message.id];
          if (local && local.updatedAt >= message.updatedAt) return;
          const fresh = await repository.get(message.id);
          if (fresh) {
            set((state) => ({ resumes: { ...state.resumes, [fresh.id]: fresh } }));
          }
          return;
        }
        case 'removed': {
          pending.delete(message.id);
          set((state) => {
            const rest = omitKey(state.resumes, message.id);
            const activeId = state.activeId === message.id ? mostRecentId(rest) : state.activeId;
            return { resumes: rest, activeId };
          });
          return;
        }
        case 'cleared': {
          pending.clear();
          set({ resumes: {}, activeId: null, saveState: 'idle' });
          return;
        }
      }
    };

    return {
      status: 'idle',
      resumes: {},
      activeId: null,
      invalidCount: 0,
      saveState: 'idle',
      message: null,

      async init() {
        // Safe to call twice (React StrictMode runs effects twice in development).
        if (get().status !== 'idle') return;
        set({ status: 'loading' });
        try {
          const { resumes, invalid } = await repository.list();
          const byId = Object.fromEntries(resumes.map((doc) => [doc.id, doc]));
          const remembered = preferences.getActiveId();
          const activeId = remembered && byId[remembered] ? remembered : mostRecentId(byId);
          set({ status: 'ready', resumes: byId, activeId, invalidCount: invalid.length });
          sync?.subscribe((message) => void onSyncMessage(message));
        } catch (error) {
          set({ status: 'error', message: describeStorageError(error) });
        }
      },

      setActive(id) {
        if (get().resumes[id]) activate(id);
      },

      createBlank(direction = 'ltr') {
        const base = direction === 'rtl' ? 'رزومه جدید' : 'Untitled resume';
        return addAndActivate(createBlankResume(uniqueName(base, names()), direction, now()));
      },

      createFromSample(sampleId) {
        const { input } = getSample(sampleId);
        const name = uniqueName(input.name, names());
        return addAndActivate(createResumeFromSample(sampleId, name, now()));
      },

      duplicate(id) {
        const source = pending.get(id) ?? get().resumes[id];
        if (!source) return Promise.resolve(null);
        const name = uniqueName(`${source.name} (copy)`, names());
        return addAndActivate(cloneResume(source, name, now()));
      },

      async remove(id) {
        pending.delete(id);
        try {
          await repository.remove(id);
        } catch (error) {
          fail(error);
          return;
        }
        const rest = omitKey(get().resumes, id);
        set({ resumes: rest, message: null });
        if (get().activeId === id) activate(mostRecentId(rest));
        sync?.post({ type: 'removed', id });
      },

      updateActive(updater) {
        const { activeId, resumes } = get();
        const current = activeId ? resumes[activeId] : undefined;
        if (!current) return;
        const next = touch(updater(current), now());
        pending.set(next.id, next);
        set({ resumes: { ...resumes, [next.id]: next }, saveState: 'unsaved' });
        scheduleSave();
      },

      async flush() {
        if (timer !== undefined) {
          clearTimeout(timer);
          timer = undefined;
        }
        if (pending.size === 0) return;

        const batch = [...pending.values()];
        pending.clear();
        set({ saveState: 'saving' });

        const failed: ResumeDocument[] = [];
        let lastError: unknown;
        for (const doc of batch) {
          try {
            await repository.save(doc);
            sync?.post({ type: 'saved', id: doc.id, updatedAt: doc.updatedAt });
          } catch (error) {
            failed.push(doc);
            lastError = error;
          }
        }

        // Keep failed documents queued unless a newer edit already replaced them.
        for (const doc of failed) {
          if (!pending.has(doc.id)) pending.set(doc.id, doc);
        }

        if (failed.length > 0) {
          set({ saveState: 'error', message: describeStorageError(lastError) });
        } else {
          set({ saveState: pending.size > 0 ? 'unsaved' : 'saved', message: null });
        }
      },

      async clearAll() {
        if (timer !== undefined) {
          clearTimeout(timer);
          timer = undefined;
        }
        pending.clear();
        try {
          await repository.clear();
        } catch (error) {
          fail(error);
          return;
        }
        preferences.setActiveId(null);
        set({ resumes: {}, activeId: null, invalidCount: 0, saveState: 'idle', message: null });
        sync?.post({ type: 'cleared' });
      },

      dismissMessage() {
        set({ message: null });
      },
    };
  });
}

export type ResumeStore = ReturnType<typeof createResumeStore>;
