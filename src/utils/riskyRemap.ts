import type { FirmwareCode } from '../types/keycode';

/** Firmware code of the Fn key (see KEY_MAP in types/keycode.ts). */
export const FN_FIRMWARE_CODE: FirmwareCode = 0xb000;

/**
 * - `replace-fn`: the physical Fn key is being replaced. This may disable Fn
 *   combinations (media, lighting, mode switching). The app cannot read the
 *   keyboard back and it has not been verified that "Reset All Keys to Default"
 *   always restores it, so the effect may be irreversible.
 * - `assign-fn`: Fn is being assigned to some other key. In tests on an RK837 this
 *   did not activate the Fn layer, so it probably will not work. The physical Fn
 *   key is untouched, so this is a mild warning.
 */
export type RemapWarning = 'replace-fn' | 'assign-fn';

/**
 * Whether a remap needs a confirmation first, and which warning to show.
 *
 * @param defaultFirmwareCode - Factory firmware code of the key being remapped
 * @param targetFirmwareCode - Firmware code it is about to be mapped to
 * @returns The warning to show, or `null` when the remap needs no confirmation
 */
export function getRemapWarning(
  defaultFirmwareCode: FirmwareCode | undefined,
  targetFirmwareCode: FirmwareCode,
): RemapWarning | null {
  const isFnKey = defaultFirmwareCode === FN_FIRMWARE_CODE;
  const targetsFn = targetFirmwareCode === FN_FIRMWARE_CODE;

  if (isFnKey && !targetsFn) return 'replace-fn';
  if (!isFnKey && targetsFn) return 'assign-fn';
  return null;
}
