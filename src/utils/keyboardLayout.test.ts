import { describe, expect, test } from 'bun:test';
import { getKeyboardLayout } from './keyboardLayout';

const bottomRow = (os: 'windows' | 'mac', iso = false) =>
  getKeyboardLayout(iso, os)[5].keys.map(item => item.keyInfo?.vk);

describe('getKeyboardLayout modifier row', () => {
  test('uses the Windows order: Ctrl, Win, Alt, with Fn on the right before Ctrl', () => {
    expect(bottomRow('windows')).toEqual([0xa2, 0x5b, 0xa4, 0x20, 0xa5, 0x5c, 0xfa, 0xa3]);
  });

  test('uses the Mac order: Fn, Control, Option, Command', () => {
    expect(bottomRow('mac')).toEqual([0xfa, 0xa2, 0xa4, 0x5b, 0x20, 0x5c, 0xa5, 0xa3]);
  });

  test('keeps the order on ISO layouts, which still get the ISO key', () => {
    expect(bottomRow('mac', true)).toEqual(bottomRow('mac'));
    expect(getKeyboardLayout(true, 'mac')[4].keys[1].keyInfo?.vk).toBe(0xe2);
  });
});
