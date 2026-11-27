import { describe, expect, test } from 'bun:test';
import {
  dropRemapped,
  emptyConfirmations,
  getConfirmations,
  setConfirmed,
  subscribeConfirmations,
  updateConfirmations,
} from './confirmationStorage';

const both = () => setConfirmed(setConfirmed(emptyConfirmations(), 'windows', 1, true), 'mac', 1, true);

describe('confirmations', () => {
  test('are kept apart per mode and can be removed', () => {
    expect(setConfirmed(both(), 'mac', 1, false)).toEqual({ windows: [1], mac: [] });
  });

  test('return the same object when nothing changes', () => {
    const confirmations = both();

    expect(setConfirmed(confirmations, 'mac', 1, true)).toBe(confirmations);
    expect(dropRemapped(confirmations, new Set([2]))).toBe(confirmations);
  });

  test('are dropped in both modes once the key is remapped', () => {
    expect(dropRemapped(both(), new Set([1]))).toEqual(emptyConfirmations());
  });

  test('notify subscribers of changes, once per change', () => {
    let calls = 0;
    const unsubscribe = subscribeConfirmations(() => calls++);
    const confirm = () => updateConfirmations('test', false, c => setConfirmed(c, 'mac', 3, true));

    confirm();
    confirm();
    unsubscribe();

    expect(calls).toBe(1);
    expect(getConfirmations('test', false).mac).toEqual([3]);
  });
});
