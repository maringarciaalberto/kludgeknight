import { describe, expect, test } from 'bun:test';
import { KEY_MAP } from '../types/keycode';
import {
  detectOs,
  getKeyInfoLabel,
  getMappingLabel,
  getPickerLabel,
  resolveLocale,
} from './keyLabels';

describe('resolveLocale', () => {
  test('auto keeps the locale of the keyboard', () => {
    expect(resolveLocale('auto', 'DE')).toBe('DE');
    expect(resolveLocale('auto', undefined)).toBeUndefined();
  });

  test('an explicit choice overrides the keyboard', () => {
    expect(resolveLocale('ES', undefined)).toBe('ES');
    expect(resolveLocale('US', 'FR')).toBeUndefined();
  });
});

describe('key names', () => {
  test('renames the six Ctrl, Alt and Win keys on Mac only', () => {
    expect(getKeyInfoLabel(KEY_MAP[0x5b], undefined, 'mac')).toBe('Left Command ⌘');
    expect(getKeyInfoLabel(KEY_MAP[0xa5], 'ES', 'mac')).toBe('Right Option ⌥');
    expect(getKeyInfoLabel(KEY_MAP[0xa2], undefined, 'mac')).toBe('Left Control ⌃');
    expect(getKeyInfoLabel(KEY_MAP[0x5b], undefined, 'windows')).toBe(KEY_MAP[0x5b].label);
  });

  test('the Mac name replaces the short picker label', () => {
    expect(getPickerLabel(KEY_MAP[0x5b], 'L Win', undefined, 'mac')).toBe('L ⌘ Cmd');
    expect(getPickerLabel(KEY_MAP[0x5b], 'L Win', undefined, 'windows')).toBe('L Win');
  });

  test('keeps macro names, which really send Ctrl', () => {
    expect(getKeyInfoLabel(KEY_MAP[0xd9], undefined, 'mac')).toBe(KEY_MAP[0xd9].label);
  });

  test('uses the chosen locale', () => {
    expect(getKeyInfoLabel(KEY_MAP[0xba], 'ES', 'mac')).toBe('ñ Ñ');
    expect(getMappingLabel(KEY_MAP[0xba].fw, 'ES', 'windows')).toBe('ñ Ñ');
  });

  test('tells the ISO key apart from backslash in US labels', () => {
    expect(getKeyInfoLabel(KEY_MAP[0xe2], undefined, 'mac')).toBe('ISO \\ |');
    expect(getKeyInfoLabel(KEY_MAP[0xdc], undefined, 'mac')).toBe('\\ |');
    expect(getMappingLabel(0x6400, undefined, 'mac')).toBe('ISO \\ |');
    expect(getKeyInfoLabel(KEY_MAP[0xe2], 'ES', 'mac')).toBe('< >');
  });

  test('names a modifier mapping according to the OS', () => {
    expect(getMappingLabel(0x040000, undefined, 'mac')).toBe('Left Option ⌥');
  });
});

describe('detectOs', () => {
  test('detects Mac and falls back to Windows', () => {
    expect(detectOs('MacIntel')).toBe('mac');
    expect(detectOs('Win32')).toBe('windows');
    expect(detectOs('Linux x86_64')).toBe('windows');
  });
});
