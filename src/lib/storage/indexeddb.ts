import type { KeyValueStore } from './key-value';

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

/**
 * IndexedDB-backed key-value store. One database, one object store, values
 * saved as structured-clone objects. The connection opens lazily on first use.
 */
export function createIndexedDbStore(dbName = 'open-vitae', storeName = 'resumes'): KeyValueStore {
  let connection: Promise<IDBDatabase> | undefined;

  const open = (): Promise<IDBDatabase> => {
    connection ??= new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('This browser does not support local storage (IndexedDB).'));
        return;
      }
      const req = indexedDB.open(dbName, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(storeName)) {
          req.result.createObjectStore(storeName);
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        // Another tab is upgrading the database: step aside and reconnect later.
        db.onversionchange = () => {
          db.close();
          connection = undefined;
        };
        resolve(db);
      };
      req.onerror = () => reject(req.error ?? new Error('Could not open local storage.'));
      req.onblocked = () =>
        reject(
          new Error('Local storage is blocked by another Open Vitae tab. Close it and reload.'),
        );
    }).catch((error: unknown) => {
      connection = undefined;
      throw error;
    });
    return connection;
  };

  async function withStore<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => Promise<T>,
  ): Promise<T> {
    const db = await open();
    const tx = db.transaction(storeName, mode);
    const done = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    });
    const result = await run(tx.objectStore(storeName));
    await done;
    return result;
  }

  return {
    get: (key) => withStore('readonly', (store) => request(store.get(key))),
    set: (key, value) =>
      withStore('readwrite', async (store) => {
        await request(store.put(value, key));
      }),
    delete: (key) =>
      withStore('readwrite', async (store) => {
        await request(store.delete(key));
      }),
    keys: () =>
      withStore('readonly', async (store) => (await request(store.getAllKeys())).map(String)),
    entries: () =>
      withStore('readonly', async (store) => {
        // Both requests are issued in the same tick, so they see the same snapshot.
        const [keys, values] = await Promise.all([
          request(store.getAllKeys()),
          request(store.getAll()),
        ]);
        return keys.map((key, i): [string, unknown] => [String(key), values[i]]);
      }),
    clear: () =>
      withStore('readwrite', async (store) => {
        await request(store.clear());
      }),
  };
}
