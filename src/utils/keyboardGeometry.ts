/**
 * Geometry for drawing a keyboard from the key rectangles in KB.ini.
 *
 * Those rectangles are the highlight areas over the product image, so they are
 * smaller than a keycap and leave wide gaps. They are enlarged evenly until
 * neighbouring caps are only a small gap apart.
 */

import type { Key } from '../types/keyboard';

export interface CapRect {
  bIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface KeyboardGeometry {
  caps: CapRect[];
  /** Area covered by all caps plus the case margin. */
  bounds: { x: number; y: number; width: number; height: number };
}

/** Space left between neighbouring caps after enlarging them. */
const CAP_GAP = 4;
/** Larger gaps separate key clusters and say nothing about the cap size. */
const MAX_NEIGHBOUR_GAP = 24;
const CASE_MARGIN = 12;

type Rect = Key['rect'];

function isValid([left, top, right, bottom]: Rect): boolean {
  return [left, top, right, bottom].every(Number.isFinite) && right > left && bottom > top;
}

function overlap(a: Rect, b: Rect): boolean {
  return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
}

/**
 * Distances between side-by-side rectangles along one axis.
 * `axis` 0 measures horizontal gaps, 1 vertical gaps.
 */
function neighbourGaps(rects: Rect[], axis: 0 | 1): number[] {
  const cross = axis === 0 ? 1 : 0;
  const gaps: number[] = [];
  for (const a of rects) {
    const following = rects
      .filter(b => b[axis] >= a[axis + 2] && b[cross] < a[cross + 2] && a[cross] < b[cross + 2])
      .map(b => b[axis] - a[axis + 2]);
    if (following.length === 0) continue;
    const gap = Math.min(...following);
    if (gap <= MAX_NEIGHBOUR_GAP) gaps.push(gap);
  }
  return gaps;
}

/** How much to grow each side: from the typical gap, never enough to make caps touch. */
function padding(gaps: number[]): number {
  if (gaps.length === 0) return 0;
  const sorted = [...gaps].sort((a, b) => a - b);
  const typical = sorted[Math.floor(sorted.length / 2)];
  const smallest = sorted[0];
  return Math.max(0, Math.min((typical - CAP_GAP) / 2, (smallest - 1) / 2));
}

/**
 * @returns `null` when the rectangles are unusable for drawing (missing, invalid
 *   or overlapping), so the caller can fall back to the product image
 */
export function getKeyboardGeometry(keys: Key[]): KeyboardGeometry | null {
  const rects = keys.map(key => key.rect);
  if (rects.length === 0 || !rects.every(isValid)) return null;
  if (rects.some((a, i) => rects.slice(i + 1).some(b => overlap(a, b)))) return null;

  const padX = padding(neighbourGaps(rects, 0));
  const padY = padding(neighbourGaps(rects, 1));

  const caps = keys.map(({ bIndex, rect: [left, top, right, bottom] }) => ({
    bIndex,
    x: left - padX,
    y: top - padY,
    width: right - left + 2 * padX,
    height: bottom - top + 2 * padY,
  }));

  const minX = Math.min(...caps.map(c => c.x)) - CASE_MARGIN;
  const minY = Math.min(...caps.map(c => c.y)) - CASE_MARGIN;
  const maxX = Math.max(...caps.map(c => c.x + c.width)) + CASE_MARGIN;
  const maxY = Math.max(...caps.map(c => c.y + c.height)) + CASE_MARGIN;

  return { caps, bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY } };
}
