import { downloadFile } from '@/lib/download';
import {
  createBroadcastSync,
  createIndexedDbStore,
  createLocalPreferences,
  createResumeRepository,
} from '@/lib/storage';
import { createVersionRepository } from '@/lib/versions/repository';

import { createResumeStore } from './resume-store';

export {
  createResumeStore,
  type ExportResult,
  type ResumeStore,
  type ResumeStoreState,
  type SaveState,
  type UpdateOptions,
} from './resume-store';
export { toast, useToastStore, type Toast } from './toast-store';

const kv = createIndexedDbStore();

/** The app-wide store, backed by IndexedDB in this browser. */
export const useResumeStore = createResumeStore({
  repository: createResumeRepository(kv),
  versions: createVersionRepository(kv),
  preferences: createLocalPreferences(),
  download: downloadFile,
  sync: createBroadcastSync(),
  appVersion: __APP_VERSION__,
});

/** Selector for the resume currently open in the editor. */
export const selectActiveResume = (state: ReturnType<typeof useResumeStore.getState>) =>
  state.activeId ? state.resumes[state.activeId] : undefined;
