/**
 * Keys the user has checked, saved per keyboard and per keyboard mode.
 *
 * The app cannot know the keyboard's mode, so the Windows/Mac choice made by the
 * user is what separates the two sets.
 */

import { z } from 'zod';
import type { FirmwareCode } from '../types/keycode';
import type { OsChoice } from './keyLabels';

const STORAGE_PREFIX = 'kludgeknight_confirmed_';

const ConfirmationSchema = z.object({
  /** What the key was doing when it was confirmed. */
  fw: z.number(),
  /** `pressed`: the browser received the expected key. `manual`: the user vouched for it. */
  method: z.enum(['pressed', 'manual']),
});

const ModeSchema = z.record(z.string(), ConfirmationSchema);
const StoreSchema = z.object({ windows: ModeSchema, mac: ModeSchema });

export type Confirmation = z.infer<typeof ConfirmationSchema>;
export type ConfirmationStore = z.infer<typeof StoreSchema>;

export const emptyStore = (): ConfirmationStore => ({ windows: {}, mac: {} });

export function setConfirmation(
  store: ConfirmationStore,
  os: OsChoice,
  keyIndex: number,
  confirmation: Confirmation | null,
): ConfirmationStore {
  const mode = { ...store[os] };
  if (confirmation) mode[keyIndex] = confirmation;
  else delete mode[keyIndex];
  return { ...store, [os]: mode };
}

/**
 * Drop confirmations of keys that no longer do what was confirmed, in both modes
 * because the keymap is shared. Returns the same object when nothing changes.
 */
export function pruneStale(
  store: ConfirmationStore,
  currentCodes: ReadonlyMap<number, FirmwareCode>,
): ConfirmationStore {
  let changed = false;
  const prune = (mode: ConfirmationStore['mac']) =>
    Object.fromEntries(
      Object.entries(mode).filter(([keyIndex, { fw }]) => {
        const keep = currentCodes.get(Number(keyIndex)) === fw;
        if (!keep) changed = true;
        return keep;
      }),
    );
  const pruned = { windows: prune(store.windows), mac: prune(store.mac) };
  return changed ? pruned : store;
}

export function loadConfirmations(deviceId: string): ConfirmationStore {
  try {
    const json = localStorage.getItem(STORAGE_PREFIX + deviceId);
    if (!json) return emptyStore();
    const result = StoreSchema.safeParse(JSON.parse(json));
    return result.success ? result.data : emptyStore();
  } catch (error) {
    console.error('Failed to load key confirmations:', error);
    return emptyStore();
  }
}

export function saveConfirmations(deviceId: string, store: ConfirmationStore): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + deviceId, JSON.stringify(store));
  } catch (error) {
    console.error('Failed to save key confirmations:', error);
  }
}
