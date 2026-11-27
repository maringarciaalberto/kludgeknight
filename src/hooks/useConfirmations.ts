import { useSyncExternalStore } from 'react';
import type { KeyboardDevice } from '../models/KeyboardDevice';
import { emptyConfirmations, getConfirmations, subscribeConfirmations } from '../utils/confirmationStorage';

const SERVER_SNAPSHOT = emptyConfirmations();

export function useConfirmations(device: KeyboardDevice) {
  return useSyncExternalStore(
    subscribeConfirmations,
    () => getConfirmations(device.id, !device.isDemo),
    () => SERVER_SNAPSHOT,
  );
}
