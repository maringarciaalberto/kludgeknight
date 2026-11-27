import { describe, expect, test } from 'bun:test';
import { FN_FIRMWARE_CODE, getRemapWarning } from './riskyRemap';

describe('getRemapWarning', () => {
  test('warns strongly when replacing the Fn key with another key', () => {
    expect(getRemapWarning(FN_FIRMWARE_CODE, 0x0400)).toBe('replace-fn');
  });

  test('warns mildly when assigning Fn to a different key', () => {
    expect(getRemapWarning(0x0400, FN_FIRMWARE_CODE)).toBe('assign-fn');
  });

  test.each([0x010000, 0x100000, 0x040000, 0x400000, 0x080000, 0x800000])(
    'warns when replacing the Ctrl, Alt or Win key with default code %i',
    (modifier) => {
      expect(getRemapWarning(modifier, 0x0400)).toBe('replace-modifier');
    },
  );

  test('does not warn when mapping a modifier onto itself', () => {
    expect(getRemapWarning(0x040000, 0x040000)).toBeNull();
  });

  test('does not warn when replacing Shift or assigning a modifier to another key', () => {
    expect(getRemapWarning(0x020000, 0x0400)).toBeNull();
    expect(getRemapWarning(0x0400, 0x040000)).toBeNull();
  });

  test('prefers the Fn warning when assigning Fn to a modifier key', () => {
    expect(getRemapWarning(0x040000, FN_FIRMWARE_CODE)).toBe('assign-fn');
  });

  test('does not warn when mapping Fn onto itself', () => {
    expect(getRemapWarning(FN_FIRMWARE_CODE, FN_FIRMWARE_CODE)).toBeNull();
  });

  test('does not warn on ordinary remaps', () => {
    expect(getRemapWarning(0x0400, 0x0500)).toBeNull();
  });

  test('still warns about assigning Fn when the default key is unknown', () => {
    expect(getRemapWarning(undefined, FN_FIRMWARE_CODE)).toBe('assign-fn');
  });

  test('does not warn about replacing Fn when the default key is unknown', () => {
    expect(getRemapWarning(undefined, 0x0400)).toBeNull();
  });
});
