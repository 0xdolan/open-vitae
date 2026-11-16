export interface StorageInfo {
  /** null when the browser does not say. */
  readonly persisted: boolean | null;
  readonly usageBytes: number | null;
  readonly quotaBytes: number | null;
}

/** How much the app stores and whether the browser may evict it under pressure. */
export async function getStorageInfo(): Promise<StorageInfo> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage) {
    return { persisted: null, usageBytes: null, quotaBytes: null };
  }
  const [persisted, estimate] = await Promise.all([
    storage.persisted ? storage.persisted().catch(() => null) : Promise.resolve(null),
    storage.estimate ? storage.estimate().catch(() => null) : Promise.resolve(null),
  ]);
  return {
    persisted,
    usageBytes: estimate?.usage ?? null,
    quotaBytes: estimate?.quota ?? null,
  };
}

/**
 * Ask the browser not to evict our data when the disk is low. Some browsers
 * grant this silently, some ask the person, some decide on engagement.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage?.persist) {
    return false;
  }
  try {
    return await storage.persist();
  } catch {
    return false;
  }
}
