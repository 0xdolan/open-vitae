import { create } from 'zustand';

/** Chrome's install prompt event; not in the DOM typings yet. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ readonly outcome: 'accepted' | 'dismissed' }>;
}

interface PwaState {
  /** False while the browser reports no network. */
  readonly online: boolean;
  /** True when the browser offered to install the app and it is not installed yet. */
  readonly installable: boolean;
  /** True when the app runs as an installed app. */
  readonly installed: boolean;
  install(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

function runningInstalled(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}

export const usePwaStore = create<PwaState>()((set) => ({
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  installable: false,
  installed: typeof window === 'undefined' ? false : runningInstalled(),
  async install() {
    const prompt = deferredPrompt;
    if (!prompt) return;
    deferredPrompt = null;
    set({ installable: false });
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') set({ installed: true });
  },
}));

/** Follow the network state and the browser's install offer. Returns a cleanup function. */
export function watchPwaEvents(target: Window = window): () => void {
  const onOnline = () => usePwaStore.setState({ online: true });
  const onOffline = () => usePwaStore.setState({ online: false });
  const onInstallPrompt = (event: Event) => {
    // Keep the browser's mini bar away; the app shows its own button.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    usePwaStore.setState({ installable: true });
  };
  const onInstalled = () => {
    deferredPrompt = null;
    usePwaStore.setState({ installable: false, installed: true });
  };
  target.addEventListener('online', onOnline);
  target.addEventListener('offline', onOffline);
  target.addEventListener('beforeinstallprompt', onInstallPrompt);
  target.addEventListener('appinstalled', onInstalled);
  return () => {
    target.removeEventListener('online', onOnline);
    target.removeEventListener('offline', onOffline);
    target.removeEventListener('beforeinstallprompt', onInstallPrompt);
    target.removeEventListener('appinstalled', onInstalled);
  };
}
