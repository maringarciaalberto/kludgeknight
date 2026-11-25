import { describe, expect, test } from 'bun:test';
import { FN_FIRMWARE_CODE, getRemapWarning } from './riskyRemap';

describe('getRemapWarning', () => {
  test('warns strongly when replacing the Fn key with another key', () => {
    expect(getRemapWarning(FN_FIRMWARE_CODE, 0x0400)).toBe('replace-fn');
  });

  test('warns mildly when assigning Fn to a different key', () => {
    expect(getRemapWarning(0x0400, FN_FIRMWARE_CODE)).toBe('assign-fn');
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
