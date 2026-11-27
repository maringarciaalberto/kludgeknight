import { describe, expect, test } from 'bun:test';
import type { Key } from '../types/keyboard';
import { getKeyboardGeometry } from './keyboardGeometry';

const key = (bIndex: number, rect: Key['rect']) => ({ bIndex, rect }) as Key;

describe('getKeyboardGeometry', () => {
  test('enlarges caps evenly without letting them touch', () => {
    const geometry = getKeyboardGeometry([
      key(0, [10, 10, 40, 40]),
      key(1, [55, 10, 85, 40]),
      key(2, [10, 54, 40, 84]),
    ])!;
    const [first, right, below] = geometry.caps;

    expect(first.width).toBeGreaterThan(30);
    expect(right.x - (first.x + first.width)).toBeGreaterThan(0);
    expect(below.y - (first.y + first.height)).toBeGreaterThan(0);
  });

  test('never grows past the smallest gap', () => {
    const { caps } = getKeyboardGeometry([
      key(0, [0, 0, 30, 30]),
      key(1, [33, 0, 63, 30]),
      key(2, [78, 0, 108, 30]),
      key(3, [123, 0, 153, 30]),
    ])!;

    expect(caps[1].x).toBeGreaterThan(caps[0].x + caps[0].width);
  });

  test('bounds contain every cap', () => {
    const { caps, bounds } = getKeyboardGeometry([key(0, [10, 10, 40, 40])])!;

    expect(bounds.x).toBeLessThan(caps[0].x);
    expect(bounds.x + bounds.width).toBeGreaterThan(caps[0].x + caps[0].width);
  });

  test('rejects missing, invalid or overlapping rectangles', () => {
    expect(getKeyboardGeometry([])).toBeNull();
    expect(getKeyboardGeometry([key(0, [10, 10, 10, 40])])).toBeNull();
    expect(getKeyboardGeometry([key(0, [0, 0, NaN, 40])])).toBeNull();
    expect(getKeyboardGeometry([key(0, [0, 0, 30, 30]), key(1, [20, 0, 50, 30])])).toBeNull();
  });
});
