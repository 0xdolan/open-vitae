import { z } from 'zod';

import type { Retention } from '@/config/versions';
import { hashString } from '@/lib/hash';
import { createId } from '@/lib/id';
import { parseResume } from '@/lib/resume-parse';
import type { KeyValueStore } from '@/lib/storage/key-value';
import type { ResumeDocument } from '@/schema/resume';

export const VERSION_REASONS = ['created', 'autosave', 'manual', 'restore', 'import'] as const;
export type VersionReason = (typeof VERSION_REASONS)[number];

const idSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

const summarySchema = z.object({
  id: idSchema,
  resumeId: idSchema,
  /** 1, 2, 3... per resume. */
  number: z.number().int().min(1),
  savedAt: z.iso.datetime(),
  reason: z.enum(VERSION_REASONS),
  /** Name given by the person for a manual version. */
  note: z.string().max(200),
  exportedAt: z.iso.datetime().nullable(),
  bytes: z.number().int().min(0),
  contentHash: z.string().max(32),
  photoKey: z.string().max(80).nullable(),
});

export type VersionSummary = z.infer<typeof summarySchema>;

const indexSchema = z.array(summarySchema);

const INDEX = 'versions:';
const RECORD = 'version:';
const PHOTO = 'photo:';

export interface RecordOptions {
  readonly reason: VersionReason;
  readonly note?: string;
  /** Record even if the content is identical to the latest version. */
  readonly force?: boolean;
  readonly now?: Date;
}

export interface VersionRepository {
  /** Newest first. */
  list(resumeId: string): Promise<VersionSummary[]>;
  /** Returns null when skipped because nothing changed since the last version. */
  record(doc: ResumeDocument, options: RecordOptions): Promise<VersionSummary | null>;
  load(resumeId: string, versionId: string): Promise<ResumeDocument | undefined>;
  markExported(resumeId: string, versionId: string, at: Date): Promise<void>;
  /** Removes the oldest autosaves beyond the limit. Named versions and the latest are kept. */
  prune(resumeId: string, retention: Retention): Promise<number>;
  removeAll(resumeId: string): Promise<void>;
  /** Deletes stored photos no version refers to any more. */
  collectGarbage(): Promise<number>;
}

/**
 * Version history on top of the key-value store.
 *
 *   versions:<resumeId>             index of summaries, oldest first
 *   version:<resumeId>:<versionId>  the document snapshot (photo stripped)
 *   photo:<hash>                    each distinct photo, stored once
 *
 * Photos are deduplicated because a resume photo can be megabytes while the
 * rest of a resume is a few kilobytes; keeping every version stays cheap.
 */
export function createVersionRepository(store: KeyValueStore): VersionRepository {
  const readIndex = async (resumeId: string): Promise<VersionSummary[]> => {
    const raw = await store.get(INDEX + resumeId);
    if (raw === undefined) return [];
    const result = indexSchema.safeParse(raw);
    return result.success ? result.data : [];
  };

  const writeIndex = (resumeId: string, index: VersionSummary[]) =>
    store.set(INDEX + resumeId, index);

  const recordKey = (resumeId: string, versionId: string) => `${RECORD}${resumeId}:${versionId}`;

  return {
    async list(resumeId) {
      return (await readIndex(resumeId)).reverse();
    },

    async record(doc, { reason, note = '', force = false, now = new Date() }) {
      let photoKey: string | null = null;
      let snapshot: ResumeDocument = doc;

      if (doc.photo) {
        photoKey = `${hashString(doc.photo.dataUrl)}-${doc.photo.dataUrl.length}`;
        if ((await store.get(PHOTO + photoKey)) === undefined) {
          await store.set(PHOTO + photoKey, doc.photo.dataUrl);
        }
        snapshot = { ...doc, photo: { ...doc.photo, dataUrl: '' } };
      }

      // The save time is not content: two saves of the same text are one version.
      const canonical = JSON.stringify({ ...snapshot, updatedAt: '' });
      const contentHash = hashString(canonical);

      const index = await readIndex(doc.id);
      const latest = index.at(-1);
      if (!force && latest?.contentHash === contentHash) {
        return null;
      }

      const summary: VersionSummary = {
        id: createId(),
        resumeId: doc.id,
        number: Math.max(0, ...index.map((v) => v.number)) + 1,
        savedAt: now.toISOString(),
        reason,
        note: note.slice(0, 200),
        exportedAt: null,
        bytes: canonical.length,
        contentHash,
        photoKey,
      };

      await store.set(recordKey(doc.id, summary.id), { doc: snapshot });
      await writeIndex(doc.id, [...index, summary]);
      return summary;
    },

    async load(resumeId, versionId) {
      const index = await readIndex(resumeId);
      const summary = index.find((v) => v.id === versionId);
      if (!summary) return undefined;

      const raw = await store.get(recordKey(resumeId, versionId));
      if (typeof raw !== 'object' || raw === null || !('doc' in raw)) return undefined;
      let doc: unknown = raw.doc;

      if (summary.photoKey) {
        const dataUrl = await store.get(PHOTO + summary.photoKey);
        if (typeof dataUrl === 'string' && typeof doc === 'object' && doc !== null && 'photo' in doc) {
          doc = { ...doc, photo: { ...(doc.photo as object), dataUrl } };
        }
      }

      const result = parseResume(doc);
      return result.ok ? result.resume : undefined;
    },

    async markExported(resumeId, versionId, at) {
      const index = await readIndex(resumeId);
      await writeIndex(
        resumeId,
        index.map((v) => (v.id === versionId ? { ...v, exportedAt: at.toISOString() } : v)),
      );
    },

    async prune(resumeId, retention) {
      if (retention === 'all') return 0;
      const index = await readIndex(resumeId);
      if (index.length <= retention) return 0;

      const latestId = index.at(-1)?.id;
      const removable = index.filter((v) => v.reason !== 'manual' && v.id !== latestId);
      const removeCount = Math.min(index.length - retention, removable.length);
      const toRemove = new Set(removable.slice(0, removeCount).map((v) => v.id));

      for (const id of toRemove) {
        await store.delete(recordKey(resumeId, id));
      }
      await writeIndex(
        resumeId,
        index.filter((v) => !toRemove.has(v.id)),
      );
      return toRemove.size;
    },

    async removeAll(resumeId) {
      for (const summary of await readIndex(resumeId)) {
        await store.delete(recordKey(resumeId, summary.id));
      }
      await store.delete(INDEX + resumeId);
    },

    async collectGarbage() {
      const keys = await store.keys();
      const referenced = new Set<string>();
      for (const key of keys) {
        if (!key.startsWith(INDEX)) continue;
        for (const summary of await readIndex(key.slice(INDEX.length))) {
          if (summary.photoKey) referenced.add(summary.photoKey);
        }
      }
      let removed = 0;
      for (const key of keys) {
        if (key.startsWith(PHOTO) && !referenced.has(key.slice(PHOTO.length))) {
          await store.delete(key);
          removed += 1;
        }
      }
      return removed;
    },
  };
}
