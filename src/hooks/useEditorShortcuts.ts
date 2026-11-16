import { useEffect } from 'react';

import { formatTime } from '@/lib/datetime';
import { toast, useResumeStore } from '@/stores';

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Editor keyboard shortcuts:
 *   Ctrl/⌘+Z            undo (outside text fields, which keep their own undo)
 *   Ctrl/⌘+Shift+Z, +Y  redo
 *   Ctrl/⌘+S            save now (instead of the browser's "Save page")
 */
export function useEditorShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      const { undo, redo, flush } = useResumeStore.getState();

      if (key === 's') {
        event.preventDefault();
        void flush().then(() => {
          const { saveState, versions } = useResumeStore.getState();
          const latest = versions[0];
          if (saveState !== 'error' && latest) {
            toast.success('Saved', `Version ${latest.number} · ${formatTime(latest.savedAt)}`);
          }
        });
        return;
      }
      if (isTextEntry(event.target)) return;
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
