import { describe, expect, it } from 'vitest';

import { toast, useToastStore } from './toast-store';

describe('toast store', () => {
  it('shows and dismisses notifications', () => {
    const id = toast.success('Export complete', 'cv.json is in your downloads.');
    expect(useToastStore.getState().toasts).toMatchObject([
      { id, tone: 'success', title: 'Export complete', durationMs: 7000 },
    ]);
    useToastStore.getState().dismiss(id);
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it('keeps errors visible longer and limits the stack to three', () => {
    toast.error('Failed');
    toast.info('a');
    toast.info('b');
    toast.info('c');
    const { toasts } = useToastStore.getState();
    expect(toasts.map((t) => t.title)).toEqual(['a', 'b', 'c']);
  });

  it('gives errors a longer display time', () => {
    useToastStore.setState({ toasts: [] });
    toast.error('Failed');
    expect(useToastStore.getState().toasts[0]?.durationMs).toBe(10_000);
  });
});
