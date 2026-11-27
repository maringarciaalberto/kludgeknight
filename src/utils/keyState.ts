import type { KeyboardDevice } from '../models/KeyboardDevice';
import type { Key } from '../types/keyboard';
import type { FirmwareCode } from '../types/keycode';

/** A mapping equal to the factory code does not count as a remap. */
export function isRemapped(key: Pick<Key, 'keyInfo'>, mapping: FirmwareCode | undefined): boolean {
  return mapping !== undefined && mapping !== key.keyInfo.fw;
}

export function getRemappedKeys(device: Pick<KeyboardDevice, 'config' | 'getMapping'>): Set<number> {
  return new Set(
    device.config.keys.filter(key => isRemapped(key, device.getMapping(key.bIndex))).map(key => key.bIndex),
  );
}
