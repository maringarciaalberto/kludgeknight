import { describe, expect, test } from 'bun:test';
import { describeKeyPress, getExpectedKey, matchKeyPress } from './keyVerification';

const press = (code: string, held: Partial<Record<'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey', boolean>> = {}) =>
  ({ code, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false, ...held });

describe('getExpectedKey', () => {
  test.each([
    [0x0400, 'KeyA'], [0x1d00, 'KeyZ'], [0x1e00, 'Digit1'], [0x2700, 'Digit0'],
    [0x2900, 'Escape'], [0x2c00, 'Space'], [0x3300, 'Semicolon'], [0x3500, 'Backquote'],
    [0x3800, 'Slash'], [0x4500, 'F12'], [0x4c00, 'Delete'], [0x5200, 'ArrowUp'],
    [0x5900, 'Numpad1'], [0x6200, 'Numpad0'], [0x6400, 'IntlBackslash'],
    [0x040000, 'AltLeft'], [0x800000, 'MetaRight'],
  ])('code %i is %s', (fw, code) => {
    expect(getExpectedKey(fw)).toEqual({ code });
  });

  test('describes macros as combinations', () => {
    expect(getExpectedKey(0x010400)).toEqual({
      code: 'KeyA',
      modifiers: { ctrl: true, shift: false, alt: false, meta: false },
    });
  });

  test('cannot check Fn, media keys or unknown codes', () => {
    expect(getExpectedKey(0xb000)).toBeNull();
    expect(getExpectedKey(0x010000e2)).toBeNull();
    expect(getExpectedKey(0x01000192)).toBeNull();
    expect(getExpectedKey(0x3200)).toBeNull();
  });
});

describe('matchKeyPress', () => {
  test('compares the physical code', () => {
    expect(matchKeyPress({ code: 'KeyA' }, press('KeyA'))).toBe('match');
    expect(matchKeyPress({ code: 'KeyA' }, press('KeyQ'))).toBe('mismatch');
  });

  test('waits for the rest of a combination and checks its modifiers', () => {
    const selectAll = getExpectedKey(0x010400)!;

    expect(matchKeyPress(selectAll, press('ControlLeft', { ctrlKey: true }))).toBe('wait');
    expect(matchKeyPress(selectAll, press('KeyA', { ctrlKey: true }))).toBe('match');
    expect(matchKeyPress(selectAll, press('KeyA'))).toBe('mismatch');
    expect(matchKeyPress(selectAll, press('KeyA', { metaKey: true }))).toBe('mismatch');
  });

  test('describes presses readably', () => {
    expect(describeKeyPress(press('KeyA', { ctrlKey: true }))).toBe('Control+KeyA');
    expect(describeKeyPress(press('MetaLeft', { metaKey: true }))).toBe('MetaLeft');
  });
});
