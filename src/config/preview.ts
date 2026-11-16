/** Zoom steps offered in the page preview, as fractions of true size. */
export const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2] as const;

/** "fit" follows the width of the panel; a number is a fixed zoom. */
export type Zoom = 'fit' | number;

export const MIN_ZOOM = ZOOM_STEPS[0];
export const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1] ?? 2;

/** The next zoom step in or out from the current zoom. */
export function stepZoom(current: number, direction: 1 | -1): number {
  if (direction > 0) return ZOOM_STEPS.find((step) => step > current + 0.001) ?? MAX_ZOOM;
  return [...ZOOM_STEPS].reverse().find((step) => step < current - 0.001) ?? MIN_ZOOM;
}

export function formatZoom(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}
