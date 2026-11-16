/**
 * Minimal async key-value interface. The app uses IndexedDB in the browser
 * and an in-memory store in tests; nothing above this layer knows which.
 */
export interface KeyValueStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  /** All keys, without loading values. */
  keys(): Promise<string[]>;
  entries(): Promise<Array<[string, unknown]>>;
  clear(): Promise<void>;
}

/** In-memory store. Values are cloned so callers cannot mutate stored data. */
export function createMemoryStore(initial: Iterable<[string, unknown]> = []): KeyValueStore {
  const data = new Map<string, unknown>(initial);
  return {
    get: async (key) => (data.has(key) ? structuredClone(data.get(key)) : undefined),
    set: async (key, value) => {
      data.set(key, structuredClone(value));
    },
    delete: async (key) => {
      data.delete(key);
    },
    keys: async () => [...data.keys()],
    entries: async () => [...data.entries()].map(([k, v]) => [k, structuredClone(v)]),
    clear: async () => {
      data.clear();
    },
  };
}
