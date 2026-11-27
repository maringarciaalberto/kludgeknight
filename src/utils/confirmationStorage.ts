/**
 * Keys the user has confirmed, kept per keyboard and per keyboard mode.
 *
 * A key is in one of three states: unconfirmed, confirmed or remapped. Only
 * unremapped keys can be confirmed. The app cannot know the keyboard's mode, so
 * the Windows/Mac choice made by the user is what separates the two lists.
 *
 * This is a small external store so that the remapper and the backup controls
 * always see the same data.
 */

import { z } from 'zod';
import type { OsChoice } from './keyLabels';

const STORAGE_PREFIX = 'kludgeknight_confirmed_';

export const ConfirmationsSchema = z.object({
  /** Key indexes confirmed in each mode. */
  windows: z.array(z.number().int()),
  mac: z.array(z.number().int()),
});

export type Confirmations = z.infer<typeof ConfirmationsSchema>;

export const emptyConfirmations = (): Confirmations => ({ windows: [], mac: [] });

export function setConfirmed(
  confirmations: Confirmations,
  os: OsChoice,
  keyIndex: number,
  confirmed: boolean,
): Confirmations {
  if (confirmations[os].includes(keyIndex) === confirmed) return confirmations;
  const list = confirmed
    ? [...confirmations[os], keyIndex].sort((a, b) => a - b)
    : confirmations[os].filter(index => index !== keyIndex);
  return { ...confirmations, [os]: list };
}

/**
 * Remapped keys stop being confirmed, in both modes because the keymap is shared.
 * Returns the same object when nothing changes.
 */
export function dropRemapped(
  confirmations: Confirmations,
  remapped: ReadonlySet<number>,
): Confirmations {
  const keep = (list: number[]) => list.filter(index => !remapped.has(index));
  const windows = keep(confirmations.windows);
  const mac = keep(confirmations.mac);
  const unchanged = windows.length === confirmations.windows.length && mac.length === confirmations.mac.length;
  return unchanged ? confirmations : { windows, mac };
}

const cache = new Map<string, Confirmations>();
const listeners = new Set<() => void>();

function load(deviceId: string): Confirmations {
  try {
    const json = localStorage.getItem(STORAGE_PREFIX + deviceId);
    if (!json) return emptyConfirmations();
    const result = ConfirmationsSchema.safeParse(JSON.parse(json));
    return result.success ? result.data : emptyConfirmations();
  } catch (error) {
    console.error('Failed to load key confirmations:', error);
    return emptyConfirmations();
  }
}

/** `persist` is false for demo devices: their confirmations only live in memory. */
export function getConfirmations(deviceId: string, persist: boolean): Confirmations {
  let confirmations = cache.get(deviceId);
  if (!confirmations) {
    confirmations = persist ? load(deviceId) : emptyConfirmations();
    cache.set(deviceId, confirmations);
  }
  return confirmations;
}

export function updateConfirmations(
  deviceId: string,
  persist: boolean,
  update: (current: Confirmations) => Confirmations,
): void {
  const current = getConfirmations(deviceId, persist);
  const next = update(current);
  if (next === current) return;

  cache.set(deviceId, next);
  if (persist) {
    try {
      localStorage.setItem(STORAGE_PREFIX + deviceId, JSON.stringify(next));
    } catch (error) {
      console.error('Failed to save key confirmations:', error);
    }
  }
  listeners.forEach(listener => listener());
}

export function subscribeConfirmations(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
