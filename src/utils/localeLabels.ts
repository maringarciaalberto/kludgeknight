/**
 * Locale-specific key label overrides for regional keyboard variants.
 * Only keys that differ from US layout need entries.
 */

import { KEY_MAP, type FirmwareCode, type VKCode } from '../types/keycode';

/**
 * Supported keyboard locales (extracted from device name in Cfg.ini)
 */
export type KeyboardLocale = 'DE' | 'FR' | 'ES';

const LOCALE_LABELS: Record<string, Partial<Record<number, string>>> = {
  // German QWERTZ
  DE: {
    // Letter swaps
    0x59: 'Z',     // Y position → Z
    0x5A: 'Y',     // Z position → Y
    // OEM keys
    0xC0: '^ °',   // ` ~ → ^ °
    0xBD: 'ß ?',   // - _ → ß ?
    0xBB: '´ `',   // = + → ´ `
    0xDB: 'ü Ü',   // [ { → ü Ü
    0xDD: '+ * ~', // ] } → + * ~
    0xBA: 'ö Ö',   // ; : → ö Ö
    0xDE: 'ä Ä',   // ' " → ä Ä
    0xDC: "# '",   // \ | → # '
    0xBF: '- _',   // / ? → - _
    0xBC: ', ;',   // , < → , ;
    0xBE: '. :',   // . > → . :
    0xE2: '< >',   // ISO key
  },

  // French AZERTY
  FR: {
    // Letter swaps
    0x41: 'Q',     // A position → Q
    0x51: 'A',     // Q position → A
    0x57: 'Z',     // W position → Z
    0x5A: 'W',     // Z position → W
    0x4D: ', ?',   // M position → , ?
    // Number row (shifted characters differ)
    0x31: '& 1',
    0x32: 'é 2',
    0x33: '" 3',
    0x34: "' 4",
    0x35: '( 5',
    0x36: '- 6',
    0x37: 'è 7',
    0x38: '_ 8',
    0x39: 'ç 9',
    0x30: 'à 0',
    // OEM keys
    0xC0: '²',       // ` ~ → ²
    0xBD: ') °',     // - _ → ) °
    0xBB: '= +',     // = + → = + (same label)
    0xDB: '^ ¨',     // [ { → ^ ¨
    0xDD: '$ £',     // ] } → $ £
    0xBA: 'm M',     // ; : → m M (AZERTY M position)
    0xDE: 'ù %',     // ' " → ù %
    0xDC: '* µ',     // \ | → * µ
    0xBF: '! §',     // / ? → ! §
    0xBC: '; .',     // , < → ; .
    0xBE: ': /',     // . > → : /
    0xE2: '< >',     // ISO key
  },

  // Spanish QWERTY
  ES: {
    // OEM keys
    0xC0: 'º ª',     // ` ~ → º ª
    0xBD: "' ?",     // - _ → ' ?
    0xBB: '¡ ¿',     // = + → ¡ ¿
    0xDB: '` ^',     // [ { → ` ^
    0xDD: '+ *',     // ] } → + *
    0xBA: 'Ñ',       // ; : → Ñ
    0xDE: '´ ¨',     // ' " → ´ ¨
    0xDC: 'Ç',       // \ | → Ç
    0xBF: '- _',     // / ? → - _
    0xBC: ', ;',     // , < → , ;
    0xBE: '. :',     // . > → . :
    0xE2: '< >',     // ISO key
  },
};

/**
 * Get locale-specific label for a VK code.
 * Returns undefined if no override exists (falls back to US label).
 */
export function getLocaleLabel(vk: VKCode, locale: string | undefined): string | undefined {
  if (!locale) return undefined;
  return LOCALE_LABELS[locale]?.[vk];
}

/**
 * Get locale-aware key name from firmware code.
 * Used for display when showing what a key is mapped to.
 */
export function getLocalizedKeyName(fwCode: FirmwareCode, locale?: string): string {
  const keyInfo = Object.values(KEY_MAP).find(k => k.fw === fwCode);
  if (!keyInfo) {
    return `0x${fwCode.toString(16)}`;
  }

  return getLocaleLabel(keyInfo.vk, locale) || keyInfo.label;
}

/**
 * Extract locale from keyboard device name.
 * Names follow pattern: "R98Pro DE Keyboard", "RK-S70 FR Keyboard"
 */
export function extractLocale(deviceName: string): KeyboardLocale | undefined {
  const match = deviceName.match(/\b(DE|FR|ES)\b/);
  return match ? (match[1] as KeyboardLocale) : undefined;
}
