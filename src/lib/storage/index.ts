export { describeStorageError, ResumeValidationError } from './errors';
export { createIndexedDbStore } from './indexeddb';
export { createMemoryStore, type KeyValueStore } from './key-value';
export { getStorageInfo, requestPersistentStorage, type StorageInfo } from './persistence';
export {
  createLocalPreferences,
  createMemoryPreferences,
  type PreferenceStore,
} from './preferences';
export {
  createResumeRepository,
  type InvalidEntry,
  type LoadResult,
  type ResumeRepository,
} from './repository';
export { createBroadcastSync, type SyncChannel, type SyncMessage } from './sync-channel';
