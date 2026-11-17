/**
 * Where a dragged item lands: the number of other items whose vertical middle
 * is above the pointer. `middles` are measured when the drag starts.
 */
export function targetIndex(pointerY: number, middles: readonly number[], from: number): number {
  let index = 0;
  middles.forEach((middle, i) => {
    if (i !== from && middle < pointerY) index += 1;
  });
  return index;
}
