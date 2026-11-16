import { describe, expect, it } from 'vitest';

import { usePwaStore, watchPwaEvents } from './pwa-store';

describe('PWA events', () => {
  it('follows the network and keeps the install offer for its own button', async () => {
    const target = new EventTarget() as unknown as Window;
    const stop = watchPwaEvents(target);

    target.dispatchEvent(new Event('offline'));
    expect(usePwaStore.getState().online).toBe(false);
    target.dispatchEvent(new Event('online'));
    expect(usePwaStore.getState().online).toBe(true);

    let prompted = 0;
    const offer = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: async () => {
        prompted += 1;
      },
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });
    target.dispatchEvent(offer);
    expect(offer.defaultPrevented).toBe(true);
    expect(usePwaStore.getState().installable).toBe(true);

    await usePwaStore.getState().install();
    expect(prompted).toBe(1);
    expect(usePwaStore.getState()).toMatchObject({ installable: false, installed: true });

    stop();
    target.dispatchEvent(new Event('offline'));
    expect(usePwaStore.getState().online).toBe(true);
  });
});
