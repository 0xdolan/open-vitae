import { registerSW } from 'virtual:pwa-register';

import { t } from '@/i18n';
import { useResumeStore } from '@/stores';
import { useToastStore } from '@/stores/toast-store';

import { watchPwaEvents } from './pwa-store';

/**
 * Registers the service worker. A new version never replaces the running one
 * by surprise: the person is asked, pending edits are written first, and only
 * then does the page reload into the new version.
 */
export function startPwa(): void {
  watchPwaEvents();
  const updateServiceWorker = registerSW({
    onNeedRefresh() {
      useToastStore.getState().show({
        tone: 'info',
        title: t('pwa.update'),
        description: t('pwa.updateBody'),
        durationMs: Number.POSITIVE_INFINITY,
        action: {
          label: t('pwa.reload'),
          onClick: () => {
            void useResumeStore
              .getState()
              .flush()
              .then(() => updateServiceWorker(true));
          },
        },
      });
    },
    onOfflineReady() {
      useToastStore
        .getState()
        .show({ tone: 'success', title: t('pwa.ready'), description: t('pwa.readyBody') });
    },
  });
}
