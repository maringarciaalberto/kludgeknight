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
    ...JSON.parse(serializeBackup(config, new Map([[1, KEY_MAP[0x42].fw]]), { windows: [2], mac: [] }, new Date(0))),
    ...overrides,
  });

describe('parseBackup', () => {
  test('reads back what was exported', () => {
    const result = parseBackup(file(), config);

    expect(result).toEqual({
      ok: true,
      mappings: new Map([[1, KEY_MAP[0x42].fw]]),
      confirmed: { windows: [2], mac: [] },
    });
  });

  test('still reads version 1 files, without confirmations', () => {
    const result = parseBackup(file({ version: 1, confirmed: undefined }), config);

    expect(result.ok && result.confirmed).toBeNull();
  });

  test('exports a remapped key only as remapped', () => {
    const exported = JSON.parse(
      serializeBackup(config, new Map([[1, 0x0500], [2, FN.fw]]), { windows: [1, 2], mac: [1] }, new Date(0)),
    );

    expect(exported.mappings).toEqual([[1, 0x0500]]);
    expect(exported.confirmed).toEqual({ windows: [2], mac: [] });
  });

  test('accepts the Mac and Windows versions of shortcuts', () => {
    for (const fw of [0x080600, 0x081900, 0x0a2100, 0x010600]) {
      expect(parseBackup(file({ mappings: [[1, fw]] }), config).ok).toBe(true);
    }
  });

  test('accepts an explicit empty list', () => {
    expect(parseBackup(file({ mappings: [] }), config).ok).toBe(true);
  });

  test.each([
    ['a missing mappings list', { mappings: undefined }],
    ['another file kind', { kind: 'something-else' }],
    ['an unknown version', { version: 3 }],
    ['a missing confirmed list', { confirmed: undefined }],
    ['a confirmed unknown key', { confirmed: { windows: [99], mac: [] } }],
    ['a key both remapped and confirmed', { confirmed: { windows: [], mac: [1] } }],
    ['a key confirmed twice', { confirmed: { windows: [2, 2], mac: [] } }],
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
