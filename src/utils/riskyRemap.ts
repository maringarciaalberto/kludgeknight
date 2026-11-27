import type { FirmwareCode } from '../types/keycode';

/** Firmware code of the Fn key (see KEY_MAP in types/keycode.ts). */
export const FN_FIRMWARE_CODE: FirmwareCode = 0xb000;

/** Factory firmware codes of the Ctrl, Alt and Win/Cmd keys, left and right. */
const MODE_MODIFIER_CODES: ReadonlySet<FirmwareCode> = new Set([
  0x010000, 0x100000, // Ctrl
  0x040000, 0x400000, // Alt
  0x080000, 0x800000, // Win / Cmd
]);

/**
 * - `replace-fn`: the physical Fn key is being replaced. This may disable Fn
 *   combinations (media, lighting, mode switching). The app cannot read the
 *   keyboard back and it has not been verified that "Reset All Keys to Default"
 *   always restores it, so the effect may be irreversible.
 * - `assign-fn`: Fn is being assigned to some other key. In tests on an RK837 this
 *   did not activate the Fn layer, so it probably will not work. The physical Fn
 *   key is untouched, so this is a mild warning.
 * - `replace-modifier`: a Ctrl, Alt or Win/Cmd key is being replaced. These keys
 *   differ between the keyboard's Mac and Windows modes, but there is a single
 *   keymap, so once remapped they behave the same in both modes. Mild warning:
 *   on an RK837, Reset All restored each mode's own layout.
 */
export type RemapWarning = 'replace-fn' | 'assign-fn' | 'replace-modifier';

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
  if (
    defaultFirmwareCode !== undefined &&
    MODE_MODIFIER_CODES.has(defaultFirmwareCode) &&
    targetFirmwareCode !== defaultFirmwareCode
  ) {
    return 'replace-modifier';
  }
  return null;
}
