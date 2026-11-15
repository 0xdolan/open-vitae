import {
  createBroadcastSync,
  createIndexedDbStore,
  createLocalPreferences,
  createResumeRepository,
} from '@/lib/storage';

import { createResumeStore } from './resume-store';

export { createResumeStore, type ResumeStore, type ResumeStoreState, type SaveState } from './resume-store';

/** The app-wide store, backed by IndexedDB in this browser. */
export const useResumeStore = createResumeStore({
  repository: createResumeRepository(createIndexedDbStore()),
  preferences: createLocalPreferences(),
  sync: createBroadcastSync(),
});

/** Selector for the resume currently open in the editor. */
export const selectActiveResume = (state: ReturnType<typeof useResumeStore.getState>) =>
  state.activeId ? state.resumes[state.activeId] : undefined;
