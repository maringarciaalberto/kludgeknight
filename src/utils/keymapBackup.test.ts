import { describe, expect, test } from 'bun:test';
import { KEY_MAP } from '../types/keycode';
import type { KeyboardConfig } from '../types/keyboard';
import { getBackupChanges, getBackupWarnings, parseBackup, serializeBackup } from './keymapBackup';

const A = KEY_MAP[0x41];
const FN = KEY_MAP[0xfa];
const config = {
  pid: '0049',
  name: 'RK-G68 Keyboard',
  keys: [{ bIndex: 1, keyInfo: A }, { bIndex: 2, keyInfo: FN }],
} as KeyboardConfig;

const file = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    ...JSON.parse(serializeBackup(config, new Map([[1, KEY_MAP[0x42].fw]]), new Date(0))),
    ...overrides,
  });

describe('parseBackup', () => {
  test('reads back what was exported', () => {
    const result = parseBackup(file(), config);

    expect(result).toEqual({ ok: true, mappings: new Map([[1, KEY_MAP[0x42].fw]]) });
  });

  test('accepts an explicit empty list', () => {
    expect(parseBackup(file({ mappings: [] }), config)).toEqual({ ok: true, mappings: new Map() });
  });

  test.each([
    ['a missing mappings list', { mappings: undefined }],
    ['another file kind', { kind: 'something-else' }],
    ['an unknown version', { version: 2 }],
    ['another keyboard', { pid: '00ff' }],
    ['an unknown key', { mappings: [[99, 0x0400]] }],
    ['an unknown code', { mappings: [[1, 0x123456]] }],
    ['a negative code', { mappings: [[1, -1]] }],
    ['a fractional code', { mappings: [[1, 1024.5]] }],
    ['a repeated key', { mappings: [[1, 0x0400], [1, 0x0500]] }],
  ])('rejects %s', (_name, overrides) => {
    expect(parseBackup(file(overrides), config).ok).toBe(false);
  });

  test('rejects text that is not JSON', () => {
    expect(parseBackup('nope', config).ok).toBe(false);
  });
});

describe('backup preview', () => {
  test('lists new remaps and keys going back to default', () => {
    const changes = getBackupChanges(config, new Map([[1, 0x0500]]), new Map([[2, 0x0600]]));

    expect(changes.map(c => [c.keyIndex, c.from, c.to])).toEqual([[1, 0x0500, A.fw], [2, FN.fw, 0x0600]]);
  });

  test('reports risky remaps in the file', () => {
    expect(getBackupWarnings(config, new Map([[2, 0x0600]]))).toEqual(new Set(['replace-fn']));
    expect(getBackupWarnings(config, new Map([[1, 0x0500]])).size).toBe(0);
  });
});
