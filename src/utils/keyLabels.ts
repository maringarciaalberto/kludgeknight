/**
 * Display names for keys, according to the layout language and operating system
 * chosen by the user. This only changes names: the codes sent to the keyboard
 * are always the same.
 */

import { z } from 'zod';
import type { FirmwareCode, KeyInfo } from '../types/keycode';
import { getLocaleLabel, getLocalizedKeyName, type KeyboardLocale } from './localeLabels';

const LayoutChoiceSchema = z.enum(['auto', 'US', 'ES', 'DE', 'FR']);
const OsChoiceSchema = z.enum(['windows', 'mac']);

export type LayoutChoice = z.infer<typeof LayoutChoiceSchema>;
export type OsChoice = z.infer<typeof OsChoiceSchema>;

export const LAYOUT_CHOICES = LayoutChoiceSchema.options;
export const OS_CHOICES = OsChoiceSchema.options;

const LAYOUT_STORAGE_KEY = 'kludgeknight_label_layout';
const OS_STORAGE_KEY = 'kludgeknight_label_os';

const ISO_KEY_VK = 0xe2;

/**
 * Mac names of the modifier keys, by firmware code. `compact` fits in the key picker.
 * Macro keys such as "Select All (Ctrl+A)" are deliberately not renamed: they
 * really do send Ctrl.
 */
const MAC_MODIFIER_NAMES: Partial<Record<FirmwareCode, { compact: string; full: string }>> = {
  0x010000: { compact: 'L ⌃ Ctrl', full: 'Left Control ⌃' },
  0x100000: { compact: 'R ⌃ Ctrl', full: 'Right Control ⌃' },
  0x040000: { compact: 'L ⌥ Opt', full: 'Left Option ⌥' },
  0x400000: { compact: 'R ⌥ Opt', full: 'Right Option ⌥' },
  0x080000: { compact: 'L ⌘ Cmd', full: 'Left Command ⌘' },
  0x800000: { compact: 'R ⌘ Cmd', full: 'Right Command ⌘' },
};

/**
 * The locale whose labels should be shown, or `undefined` for US labels.
 * `auto` keeps the locale deduced from the keyboard's name.
 */
export function resolveLocale(
  choice: LayoutChoice,
  deviceLocale: string | undefined,
): KeyboardLocale | undefined {
  if (choice === 'auto') return deviceLocale as KeyboardLocale | undefined;
  return choice === 'US' ? undefined : choice;
}

/** Full name of a key, for tooltips and descriptions. */
export function getKeyInfoLabel(keyInfo: KeyInfo, locale: string | undefined, os: OsChoice): string {
  const macName = os === 'mac' ? MAC_MODIFIER_NAMES[keyInfo.fw] : undefined;
  if (macName) return macName.full;

  const localized = getLocaleLabel(keyInfo.vk, locale);
  if (localized) return localized;

  // In US labels the ISO key would otherwise look identical to the regular "\ |" key.
  return keyInfo.vk === ISO_KEY_VK ? `ISO ${keyInfo.label}` : keyInfo.label;
}

/**
 * Text drawn on a key of the picker.
 *
 * @param layoutLabel - Shorter label defined by the picker layout, if any
 */
export function getPickerLabel(
  keyInfo: KeyInfo,
  layoutLabel: string | undefined,
  locale: string | undefined,
  os: OsChoice,
): string {
  const macName = os === 'mac' ? MAC_MODIFIER_NAMES[keyInfo.fw] : undefined;
  return macName?.compact ?? layoutLabel ?? getKeyInfoLabel(keyInfo, locale, os);
}

/** Name of whatever a firmware code does, for showing the current mapping. */
export function getMappingLabel(
  fwCode: FirmwareCode,
  locale: string | undefined,
  os: OsChoice,
): string {
  const macName = os === 'mac' ? MAC_MODIFIER_NAMES[fwCode] : undefined;
  if (macName) return macName.full;

  // 0x6400 is the ISO key.
  if (!locale && fwCode === 0x6400) return `ISO ${getLocalizedKeyName(fwCode)}`;
  return getLocalizedKeyName(fwCode, locale);
}

/**
 * Short text printed on a cap of the keyboard drawing for a firmware code.
 *
 * @param keyInfo - Key that produces the code, if known
 * @param layoutLabel - Shorter label defined by the picker layout, if any
 */
export function getCapLegend(
  fwCode: FirmwareCode,
  keyInfo: KeyInfo | undefined,
  layoutLabel: string | undefined,
  locale: string | undefined,
  os: OsChoice,
): string {
  if (!keyInfo) return getMappingLabel(fwCode, locale, os);
  return getPickerLabel(keyInfo, layoutLabel, locale, os);
}

/** Initial OS naming, from the computer running the app (not the keyboard's mode). */
export function detectOs(platform: string): OsChoice {
  return /mac|iphone|ipad/i.test(platform) ? 'mac' : 'windows';
}

function readStorage(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Failed to save label preference:', error);
  }
}

export function loadLayoutChoice(): LayoutChoice {
  const stored = LayoutChoiceSchema.safeParse(readStorage(LAYOUT_STORAGE_KEY));
  return stored.success ? stored.data : 'auto';
}

export function loadOsChoice(): OsChoice {
  const stored = OsChoiceSchema.safeParse(readStorage(OS_STORAGE_KEY));
  if (stored.success) return stored.data;
  return detectOs(typeof navigator === 'undefined' ? '' : navigator.platform);
}

export function saveLayoutChoice(choice: LayoutChoice): void {
  writeStorage(LAYOUT_STORAGE_KEY, choice);
}

export function saveOsChoice(choice: OsChoice): void {
  writeStorage(OS_STORAGE_KEY, choice);
}
