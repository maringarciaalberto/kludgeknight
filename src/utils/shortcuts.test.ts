import { describe, expect, test } from 'bun:test';
import { KEY_MAP } from '../types/keycode';
import { getCapLegend, getMappingLabel } from './keyLabels';
import { getExpectedKey, describeKeyPress } from './keyVerification';
import { findShortcut, getShortcutsFor, SHORTCUT_CODES, SHORTCUTS } from './shortcuts';

const sends = (fw: number) => describeKeyPress(getExpectedKey(fw)!);

describe('shortcuts', () => {
  test.each([
    ['Copy', 'Meta+KeyC', 'Control+KeyC'],
    ['Paste', 'Meta+KeyV', 'Control+KeyV'],
    ['Cut', 'Meta+KeyX', 'Control+KeyX'],
    ['Undo', 'Meta+KeyZ', 'Control+KeyZ'],
    ['Select All', 'Meta+KeyA', 'Control+KeyA'],
    ['Save', 'Meta+KeyS', 'Control+KeyS'],
    ['Screenshot area', 'Shift+Meta+Digit4', 'Shift+Meta+KeyS'],
  ])('%s sends %s on Mac and %s on Windows', (name, mac, windows) => {
    const shortcut = SHORTCUTS.find(s => s.name === name)!;

    expect(sends(shortcut.mac.fw)).toBe(mac);
    expect(sends(shortcut.windows.fw)).toBe(windows);
  });

  test('Windows versions match the codes the app already used', () => {
    for (const vk of [0xb9, 0xc6, 0xb8, 0xc1, 0xd9, 0xc7]) {
      expect(findShortcut(KEY_MAP[vk].fw)).toBeDefined();
    }
  });

  test('every code is unique', () => {
    expect(SHORTCUT_CODES.size).toBe(SHORTCUTS.length * 2);
  });

  test('offers the version of the chosen system', () => {
    expect(getShortcutsFor('mac')[0]).toEqual({ name: 'Copy', fw: 0x080600, keys: '⌘C' });
    expect(getShortcutsFor('windows')[0].keys).toBe('Ctrl+C');
  });

  test('names describe what is sent, whatever system is shown', () => {
    expect(getMappingLabel(0x080600, undefined, 'windows')).toBe('Copy (⌘C)');
    expect(getMappingLabel(0x010600, undefined, 'mac')).toBe('Copy (Ctrl+C)');
    expect(getCapLegend(0x081900, undefined, undefined, 'ES', 'windows')).toBe('⌘V');
  });
});
