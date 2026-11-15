import { create } from 'zustand';

import type { TextDirection } from '@/config/fonts';
import type { Retention } from '@/config/versions';
import type { DownloadFn } from '@/lib/download';
import { createJsonExport } from '@/lib/export/json';
import { omitKey } from '@/lib/object';
import {
  cloneResume,
  createBlankResume,
  sortByUpdated,
  touch,
  uniqueName,
} from '@/lib/resume-factory';
import { parseResume } from '@/lib/resume-parse';
import {
  describeStorageError,
  type PreferenceStore,
  type ResumeRepository,
  type SyncChannel,
  type SyncMessage,
} from '@/lib/storage';
import type { VersionReason, VersionRepository, VersionSummary } from '@/lib/versions/repository';
import { createResumeFromSample, getSample, type SampleId } from '@/samples';
import type { ResumeDocument } from '@/schema/resume';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
export type SaveState = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

export interface UpdateOptions {
  /**
   * Edits with the same group key made within a short time become one undo
   * step, so undo removes a typed word or sentence, not one letter.
   */
  readonly group?: string;
}

/** How many document states undo keeps per open resume. */
export const UNDO_LIMIT = 100;
const GROUP_WINDOW_MS = 1500;

export interface ExportResult {
  readonly fileName: string;
  readonly version: VersionSummary | null;
}

export interface ResumeStoreState {
  readonly status: LoadStatus;
  readonly resumes: Readonly<Record<string, ResumeDocument>>;
  readonly activeId: string | null;
  /** Stored entries that could not be read (left untouched in storage). */
  readonly invalidCount: number;
  readonly saveState: SaveState;
  /** Last error, phrased for the person using the app. */
  readonly message: string | null;
  /** Version history of the active resume, newest first. */
  readonly versions: readonly VersionSummary[];
  readonly retention: Retention;
  readonly canUndo: boolean;
  readonly canRedo: boolean;

  init(): Promise<void>;
  setActive(id: string): void;
  createBlank(direction?: TextDirection): Promise<ResumeDocument | null>;
  createFromSample(sampleId: SampleId): Promise<ResumeDocument | null>;
  duplicate(id: string): Promise<ResumeDocument | null>;
  remove(id: string): Promise<void>;
  /** Change the active resume; it is saved (and versioned) automatically shortly after. */
  updateActive(updater: (doc: ResumeDocument) => ResumeDocument, options?: UpdateOptions): void;
  undo(): void;
  redo(): void;
  /** Write any pending changes now (on tab hide, before export...). */
  flush(): Promise<void>;
  clearAll(): Promise<void>;
  dismissMessage(): void;

  refreshVersions(): Promise<void>;
  /** Save the current state as a named version, even if nothing changed. */
  saveNamedVersion(note: string): Promise<VersionSummary | null>;
  /** Bring back an older version. The current state is already a version, so nothing is lost. */
  restoreVersion(versionId: string): Promise<VersionSummary | null>;
  setRetention(retention: Retention): Promise<void>;
  /** Download the active resume (or one of its versions) as a JSON backup. */
  exportJson(versionId?: string): Promise<ExportResult | null>;
}

export interface ResumeStoreDeps {
  readonly repository: ResumeRepository;
  readonly versions: VersionRepository;
  readonly preferences: PreferenceStore;
  readonly download: DownloadFn;
  readonly sync?: SyncChannel | null;
  readonly autosaveDelayMs?: number;
  readonly appVersion?: string;
  readonly now?: () => Date;
}

function mostRecentId(resumes: Readonly<Record<string, ResumeDocument>>): string | null {
  return sortByUpdated(Object.values(resumes))[0]?.id ?? null;
}

/**
 * Creates the resume store. Dependencies are injected so tests can use an
 * in-memory repository, a fake download and short timers.
 *
 * Every successful save is also recorded as a version with its date and time,
 * unless the content is identical to the previous version.
 */
export function createResumeStore({
  repository,
  versions,
  preferences,
  download,
  sync = null,
  autosaveDelayMs = 600,
  appVersion = '0.0.0',
  now = () => new Date(),
}: ResumeStoreDeps) {
  /** Edited documents waiting to be written, by id. */
  const pending = new Map<string, ResumeDocument>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  /** Undo history of the open resume, in memory only. */
  let past: ResumeDocument[] = [];
  let future: ResumeDocument[] = [];
  let lastGroup: { readonly key: string; readonly at: number } | null = null;

  return create<ResumeStoreState>()((set, get) => {
    const names = () => Object.values(get().resumes).map((doc) => doc.name);

    const fail = (error: unknown) => {
      set({ message: describeStorageError(error) });
    };

    const loadVersions = async (resumeId: string) => {
      try {
        const list = await versions.list(resumeId);
        if (get().activeId === resumeId) set({ versions: list });
      } catch (error) {
        fail(error);
      }
    };

    const resetHistory = () => {
      past = [];
      future = [];
      lastGroup = null;
      set({ canUndo: false, canRedo: false });
    };

    const activate = (id: string | null) => {
      preferences.setActiveId(id);
      resetHistory();
      set({ activeId: id, versions: [] });
      if (id) void loadVersions(id);
    };

    /** Put a document state in place as an unsaved edit and schedule the save. */
    const applyEdit = (next: ResumeDocument) => {
      const stamped = touch(next, now());
      pending.set(stamped.id, stamped);
      set((state) => ({
        resumes: { ...state.resumes, [stamped.id]: stamped },
        saveState: 'unsaved',
        canUndo: past.length > 0,
        canRedo: future.length > 0,
      }));
      scheduleSave();
    };

    /** Record a version after a successful save. Never fails the save itself. */
    const recordVersion = async (
      doc: ResumeDocument,
      reason: VersionReason,
      note = '',
      force = false,
    ): Promise<VersionSummary | null> => {
      try {
        const summary = await versions.record(doc, { reason, note, force, now: now() });
        const { retention } = get();
        if (summary && retention !== 'all') {
          await versions.prune(doc.id, retention);
        }
        await loadVersions(doc.id);
        return summary;
      } catch (error) {
        set({
          message: `Saved, but the version history could not be updated. ${describeStorageError(error)}`,
        });
        return null;
      }
    };

    /** Save a new document immediately, version it and make it active. */
    const addAndActivate = async (doc: ResumeDocument): Promise<ResumeDocument | null> => {
      try {
        const saved = await repository.save(doc);
        set((state) => ({ resumes: { ...state.resumes, [saved.id]: saved }, message: null }));
        activate(saved.id);
        await recordVersion(saved, 'created');
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
          if (get().activeId === message.id) void loadVersions(message.id);
          // Never overwrite edits this tab has not saved yet.
          if (pending.has(message.id)) return;
          const local = get().resumes[message.id];
          if (local && local.updatedAt >= message.updatedAt) return;
          const fresh = await repository.get(message.id);
          if (fresh) {
            // Undo steps from before another tab's change would overwrite it.
            if (get().activeId === fresh.id) resetHistory();
            set((state) => ({ resumes: { ...state.resumes, [fresh.id]: fresh } }));
          }
          return;
        }
        case 'removed': {
          pending.delete(message.id);
          const rest = omitKey(get().resumes, message.id);
          set({ resumes: rest });
          if (get().activeId === message.id) activate(mostRecentId(rest));
          return;
        }
        case 'cleared': {
          pending.clear();
          set({ resumes: {}, activeId: null, versions: [], saveState: 'idle' });
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
      versions: [],
      retention: preferences.getRetention(),
      canUndo: false,
      canRedo: false,

      async init() {
        // Safe to call twice (React StrictMode runs effects twice in development).
        if (get().status !== 'idle') return;
        set({ status: 'loading' });
        try {
          const { resumes, invalid } = await repository.list();
          const byId = Object.fromEntries(resumes.map((doc) => [doc.id, doc]));
          const remembered = preferences.getActiveId();
          const activeId = remembered && byId[remembered] ? remembered : mostRecentId(byId);
          set({ status: 'ready', resumes: byId, invalidCount: invalid.length });
          activate(activeId);
          sync?.subscribe((message) => void onSyncMessage(message));
          void versions.collectGarbage().catch(() => undefined);
        } catch (error) {
          set({ status: 'error', message: describeStorageError(error) });
        }
      },

      setActive(id) {
        if (get().resumes[id] && get().activeId !== id) activate(id);
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
          await versions.removeAll(id);
          void versions.collectGarbage().catch(() => undefined);
        } catch (error) {
          fail(error);
          return;
        }
        const rest = omitKey(get().resumes, id);
        set({ resumes: rest, message: null });
        if (get().activeId === id) activate(mostRecentId(rest));
        sync?.post({ type: 'removed', id });
      },

      updateActive(updater, options = {}) {
        const { activeId, resumes } = get();
        const current = activeId ? resumes[activeId] : undefined;
        if (!current) return;
        const next = updater(current);
        if (next === current) return;

        const at = now().getTime();
        const sameGroup =
          options.group !== undefined &&
          lastGroup?.key === options.group &&
          at - lastGroup.at < GROUP_WINDOW_MS;
        if (!sameGroup) {
          past.push(current);
          if (past.length > UNDO_LIMIT) past.shift();
        }
        future = [];
        lastGroup = options.group === undefined ? null : { key: options.group, at };
        applyEdit(next);
      },

      undo() {
        const { activeId, resumes } = get();
        const current = activeId ? resumes[activeId] : undefined;
        const previous = past.pop();
        if (!current || !previous) return;
        future.push(current);
        lastGroup = null;
        applyEdit(previous);
      },

      redo() {
        const { activeId, resumes } = get();
        const current = activeId ? resumes[activeId] : undefined;
        const next = future.pop();
        if (!current || !next) return;
        past.push(current);
        lastGroup = null;
        applyEdit(next);
      },

      async flush() {
        if (timer !== undefined) {
          clearTimeout(timer);
          timer = undefined;
        }
        if (pending.size === 0) return;

        const batch = [...pending.values()];
        const hadError = get().saveState === 'error';
        pending.clear();
        set({ saveState: 'saving' });

        const failed: ResumeDocument[] = [];
        let lastError: unknown;
        for (const doc of batch) {
          try {
            const saved = await repository.save(doc);
            await recordVersion(saved, 'autosave');
            sync?.post({ type: 'saved', id: saved.id, updatedAt: saved.updatedAt });
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
          set((state) => ({
            saveState: pending.size > 0 ? 'unsaved' : 'saved',
            // A successful save clears the message left by an earlier failed save.
            message: hadError ? null : state.message,
          }));
        }
      },

      async clearAll() {
        if (timer !== undefined) {
          clearTimeout(timer);
          timer = undefined;
        }
        pending.clear();
        try {
          // Resumes, versions and photos share one store, so this removes everything.
          await repository.clear();
        } catch (error) {
          fail(error);
          return;
        }
        preferences.setActiveId(null);
        set({
          resumes: {},
          activeId: null,
          versions: [],
          invalidCount: 0,
          saveState: 'idle',
          message: null,
        });
        sync?.post({ type: 'cleared' });
      },

      dismissMessage() {
        set({ message: null });
      },

      async refreshVersions() {
        const { activeId } = get();
        if (activeId) await loadVersions(activeId);
      },

      async saveNamedVersion(note) {
        await get().flush();
        const { activeId, resumes } = get();
        const doc = activeId ? resumes[activeId] : undefined;
        if (!doc || get().saveState === 'error') return null;
        return recordVersion(doc, 'manual', note.trim(), true);
      },

      async restoreVersion(versionId) {
        await get().flush();
        const { activeId, versions: list } = get();
        if (!activeId) return null;
        const source = list.find((v) => v.id === versionId);
        try {
          const old = await versions.load(activeId, versionId);
          if (!old || !source) {
            set({ message: 'That version could not be read, so nothing was changed.' });
            return null;
          }
          const before = get().resumes[activeId];
          const restored = await repository.save(touch({ ...old, id: activeId }, now()));
          if (before) {
            past.push(before);
            future = [];
            lastGroup = null;
          }
          set((state) => ({
            resumes: { ...state.resumes, [restored.id]: restored },
            saveState: 'saved',
            canUndo: past.length > 0,
            canRedo: false,
          }));
          sync?.post({ type: 'saved', id: restored.id, updatedAt: restored.updatedAt });
          return recordVersion(restored, 'restore', `Restored from version ${source.number}`, true);
        } catch (error) {
          fail(error);
          return null;
        }
      },

      async setRetention(retention) {
        preferences.setRetention(retention);
        set({ retention });
        if (retention === 'all') return;
        try {
          for (const id of Object.keys(get().resumes)) {
            await versions.prune(id, retention);
          }
          void versions.collectGarbage().catch(() => undefined);
          await get().refreshVersions();
        } catch (error) {
          fail(error);
        }
      },

      async exportJson(versionId) {
        await get().flush();
        const { activeId, resumes } = get();
        const current = activeId ? resumes[activeId] : undefined;
        if (!activeId || !current) return null;

        try {
          let doc: ResumeDocument | undefined;
          let version: VersionSummary | null;
          if (versionId) {
            doc = await versions.load(activeId, versionId);
            version = get().versions.find((v) => v.id === versionId) ?? null;
          } else {
            const parsed = parseResume(current);
            if (!parsed.ok) {
              set({ message: `Fix this before exporting: ${parsed.error}` });
              return null;
            }
            doc = parsed.resume;
            version = get().versions[0] ?? null;
          }
          if (!doc) {
            set({ message: 'That version could not be read, so nothing was exported.' });
            return null;
          }

          const file = createJsonExport(doc, version, appVersion, now());
          download(file.fileName, file.content, file.mimeType);
          if (version) {
            await versions.markExported(activeId, version.id, now());
            await loadVersions(activeId);
          }
          return { fileName: file.fileName, version };
        } catch (error) {
          fail(error);
          return null;
        }
      },
    };
  });
}

export type ResumeStore = ReturnType<typeof createResumeStore>;
