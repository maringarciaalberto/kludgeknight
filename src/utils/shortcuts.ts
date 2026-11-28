/**
 * Keyboard shortcuts that can be assigned to a single key.
 *
 * Each firmware code is modifier flags (bits 23..16) plus a USB HID usage ID
 * (bits 15..8), the format of the macro codes in KEY_MAP.
 *
 * The keyboard has one keymap for its Mac and Windows modes, so a key holds one
 * shortcut. The chosen system only decides which version is offered: names
 * always describe what the code really sends.
 */

import type { FirmwareCode } from '../types/keycode';
import type { OsChoice } from './keyLabels';

export interface ShortcutVariant {
  fw: FirmwareCode;
  keys: string;
}

export interface Shortcut {
  name: string;
  mac: ShortcutVariant;
  windows: ShortcutVariant;
}

const CTRL = 0x010000;
const SHIFT = 0x020000;
const CMD_OR_WIN = 0x080000;

/** The usual shortcut: Command on Mac and Control on Windows, with the same letter. */
const standard = (name: string, letter: string, usage: number): Shortcut => ({
  name,
  mac: { fw: CMD_OR_WIN | (usage << 8), keys: `⌘${letter}` },
  windows: { fw: CTRL | (usage << 8), keys: `Ctrl+${letter}` },
});

export const SHORTCUTS: Shortcut[] = [
  standard('Copy', 'C', 0x06),
  standard('Paste', 'V', 0x19),
  standard('Cut', 'X', 0x1b),
  standard('Undo', 'Z', 0x1d),
  standard('Select All', 'A', 0x04),
  standard('Save', 'S', 0x16),
  {
    name: 'Screenshot area',
    mac: { fw: CMD_OR_WIN | SHIFT | 0x2100, keys: '⇧⌘4' },
    windows: { fw: CMD_OR_WIN | SHIFT | 0x1600, keys: 'Win+Shift+S' },
  },
];

const BY_CODE = new Map(
  SHORTCUTS.flatMap(({ name, mac, windows }) =>
    [mac, windows].map(variant => [variant.fw, { name, keys: variant.keys }] as const),
  ),
);

export function findShortcut(fwCode: FirmwareCode): { name: string; keys: string } | undefined {
  return BY_CODE.get(fwCode);
}

export const SHORTCUT_CODES: ReadonlySet<FirmwareCode> = new Set(BY_CODE.keys());

export function getShortcutsFor(os: OsChoice): { name: string; fw: FirmwareCode; keys: string }[] {
  return SHORTCUTS.map(shortcut => ({ name: shortcut.name, ...shortcut[os] }));
}
