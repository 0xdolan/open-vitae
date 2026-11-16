/**
 * Tells other open tabs of the app that stored data changed, so two tabs never
 * silently overwrite each other's edits. Messages carry ids only.
 */
export type SyncMessage =
  | { readonly type: 'saved'; readonly id: string; readonly updatedAt: string }
  | { readonly type: 'removed'; readonly id: string }
  | { readonly type: 'cleared' };

export interface SyncChannel {
  post(message: SyncMessage): void;
  subscribe(listener: (message: SyncMessage) => void): () => void;
}

function isSyncMessage(value: unknown): value is SyncMessage {
  if (typeof value !== 'object' || value === null) return false;
  const msg = value as Record<string, unknown>;
  switch (msg.type) {
    case 'saved':
      return typeof msg.id === 'string' && typeof msg.updatedAt === 'string';
    case 'removed':
      return typeof msg.id === 'string';
    case 'cleared':
      return true;
    default:
      return false;
  }
}

/** Returns null where BroadcastChannel is unavailable; the app then works single-tab. */
export function createBroadcastSync(name = 'open-vitae-sync'): SyncChannel | null {
  if (typeof BroadcastChannel === 'undefined') {
    return null;
  }
  const channel = new BroadcastChannel(name);
  return {
    post: (message) => channel.postMessage(message),
    subscribe(listener) {
      const handler = (event: MessageEvent<unknown>) => {
        if (isSyncMessage(event.data)) listener(event.data);
      };
      channel.addEventListener('message', handler);
      return () => channel.removeEventListener('message', handler);
    },
  };
}
