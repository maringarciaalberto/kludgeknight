/**
 * What the browser should receive when a key does what the app thinks it does.
 *
 * The keyboard cannot be read back, so pressing a key is the only way to check it.
 */

import type { FirmwareCode } from '../types/keycode';

export interface ExpectedKey {
  /** `KeyboardEvent.code` */
  code: string;
  /** Set for key combinations: the exact modifiers held with `code`. */
  modifiers?: { ctrl: boolean; shift: boolean; alt: boolean; meta: boolean };
}

export type KeyPress = Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey'>;

/** Single modifier keys, which the firmware encodes as bit flags. */
const MODIFIER_CODES: Partial<Record<FirmwareCode, string>> = {
  0x010000: 'ControlLeft',
  0x020000: 'ShiftLeft',
  0x040000: 'AltLeft',
  0x080000: 'MetaLeft',
  0x100000: 'ControlRight',
  0x200000: 'ShiftRight',
  0x400000: 'AltRight',
  0x800000: 'MetaRight',
};

const range = (start: number, codes: string[]): [number, string][] =>
  codes.map((code, i) => [start + i, code]);

/** `KeyboardEvent.code` by USB HID usage ID. */
const HID_CODES = new Map<number, string>([
  ...range(0x04, [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(letter => `Key${letter}`)),
  ...range(0x1e, [...'1234567890'].map(digit => `Digit${digit}`)),
  ...range(0x28, ['Enter', 'Escape', 'Backspace', 'Tab', 'Space', 'Minus', 'Equal',
    'BracketLeft', 'BracketRight', 'Backslash']),
  ...range(0x33, ['Semicolon', 'Quote', 'Backquote', 'Comma', 'Period', 'Slash', 'CapsLock']),
  ...range(0x3a, Array.from({ length: 12 }, (_, i) => `F${i + 1}`)),
  ...range(0x46, ['PrintScreen', 'ScrollLock', 'Pause', 'Insert', 'Home', 'PageUp', 'Delete',
    'End', 'PageDown', 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'NumLock',
    'NumpadDivide', 'NumpadMultiply', 'NumpadSubtract', 'NumpadAdd', 'NumpadEnter']),
  ...range(0x59, [...'1234567890'].map(digit => `Numpad${digit}`)),
  [0x63, 'NumpadDecimal'],
  [0x64, 'IntlBackslash'],
  [0x65, 'ContextMenu'],
]);

/** Codes for which macOS has been seen to report a different `code`. */
export const SWAPPABLE_CODES: ReadonlySet<string> = new Set(['Backquote', 'IntlBackslash']);

/**
 * @returns `null` when pressing the key cannot be checked in the browser
 *   (Fn, media keys and codes with no known equivalent)
 */
export function getExpectedKey(fwCode: FirmwareCode): ExpectedKey | null {
  const modifier = MODIFIER_CODES[fwCode];
  if (modifier) return { code: modifier };

  if (fwCode > 0xffffff || (fwCode & 0xff) !== 0) return null;
  const code = HID_CODES.get((fwCode >> 8) & 0xff);
  if (!code) return null;

  const flags = fwCode >> 16;
  if (flags === 0) return { code };
  return {
    code,
    modifiers: {
      ctrl: (flags & 0x11) !== 0,
      shift: (flags & 0x22) !== 0,
      alt: (flags & 0x44) !== 0,
      meta: (flags & 0x88) !== 0,
    },
  };
}

const IS_MODIFIER_CODE = /^(Control|Shift|Alt|Meta)(Left|Right)$/;

/**
 * Compare a keydown with what was expected. `wait` means the press is only part
 * of a combination and the rest is still to come.
 */
export function matchKeyPress(expected: ExpectedKey, press: KeyPress): 'match' | 'mismatch' | 'wait' {
  const { modifiers } = expected;
  if (!modifiers) return press.code === expected.code ? 'match' : 'mismatch';

  if (IS_MODIFIER_CODE.test(press.code)) return 'wait';
  const matches =
    press.code === expected.code &&
    press.ctrlKey === modifiers.ctrl &&
    press.shiftKey === modifiers.shift &&
    press.altKey === modifiers.alt &&
    press.metaKey === modifiers.meta;
  return matches ? 'match' : 'mismatch';
}

/** Readable form of a press or expectation, e.g. "Control+KeyA". */
export function describeKeyPress(press: KeyPress | ExpectedKey): string {
  const held = 'ctrlKey' in press
    ? { ctrl: press.ctrlKey, shift: press.shiftKey, alt: press.altKey, meta: press.metaKey }
    : press.modifiers;
  if (!held || IS_MODIFIER_CODE.test(press.code)) return press.code;

  const names = [held.ctrl && 'Control', held.shift && 'Shift', held.alt && 'Alt', held.meta && 'Meta'];
  return [...names.filter(Boolean), press.code].join('+');
}
