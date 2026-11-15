import { parseResume } from '@/lib/resume-parse';
import type { ResumeDocument } from '@/schema/resume';

import { ResumeValidationError } from './errors';
import type { KeyValueStore } from './key-value';

const KEY_PREFIX = 'resume:';

export interface InvalidEntry {
  readonly key: string;
  readonly reason: string;
}

export interface LoadResult {
  readonly resumes: ResumeDocument[];
  /** Entries that could not be read. They are left in storage untouched. */
  readonly invalid: InvalidEntry[];
}

export interface ResumeRepository {
  list(): Promise<LoadResult>;
  get(id: string): Promise<ResumeDocument | undefined>;
  /** Validates before writing; throws ResumeValidationError for invalid data. */
  save(doc: ResumeDocument): Promise<ResumeDocument>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Resume persistence on top of any key-value store. Data is migrated and
 * validated on every read and every write, so a corrupted or tampered entry
 * can never reach the editor, and invalid data is never written.
 */
export function createResumeRepository(store: KeyValueStore): ResumeRepository {
  return {
    async list() {
      const resumes: ResumeDocument[] = [];
      const invalid: InvalidEntry[] = [];
      // Read resume keys only: version snapshots live in the same store.
      for (const key of await store.keys()) {
        if (!key.startsWith(KEY_PREFIX)) continue;
        const result = parseResume(await store.get(key));
        if (result.ok) {
          resumes.push(result.resume);
        } else {
          invalid.push({ key, reason: result.error });
        }
      }
      return { resumes, invalid };
    },

    async get(id) {
      const value = await store.get(KEY_PREFIX + id);
      if (value === undefined) return undefined;
      const result = parseResume(value);
      return result.ok ? result.resume : undefined;
    },

    async save(doc) {
      const result = parseResume(doc);
      if (!result.ok) {
        throw new ResumeValidationError(result.error);
      }
      await store.set(KEY_PREFIX + result.resume.id, result.resume);
      return result.resume;
    },

    async remove(id) {
      await store.delete(KEY_PREFIX + id);
    },

    async clear() {
      await store.clear();
    },
  };
}
