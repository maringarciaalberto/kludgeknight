import { describe, expect, test } from 'bun:test';
import { emptyStore, pruneStale, setConfirmation } from './confirmationStorage';

const confirmed = () => {
  const windows = setConfirmation(emptyStore(), 'windows', 1, { fw: 0x0400, method: 'pressed' });
  return setConfirmation(windows, 'mac', 1, { fw: 0x0400, method: 'manual' });
};

describe('confirmations', () => {
  test('are kept apart per mode and can be removed', () => {
    const store = setConfirmation(confirmed(), 'mac', 1, null);

    expect(store.mac).toEqual({});
    expect(store.windows[1]).toEqual({ fw: 0x0400, method: 'pressed' });
  });

  test('stay while the key does the same, returning the same object', () => {
    const store = confirmed();

    expect(pruneStale(store, new Map([[1, 0x0400]]))).toBe(store);
  });

  test('are dropped in both modes once the key changes', () => {
    expect(pruneStale(confirmed(), new Map([[1, 0x0500]]))).toEqual(emptyStore());
  });
});
