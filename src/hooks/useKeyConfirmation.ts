import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { KeyboardDevice } from '../models/KeyboardDevice';
import type { OsChoice } from '../utils/keyLabels';
import {
  emptyStore,
  loadConfirmations,
  pruneStale,
  saveConfirmations,
  setConfirmation,
  type Confirmation,
} from '../utils/confirmationStorage';
import { describeKeyPress, getExpectedKey, matchKeyPress } from '../utils/keyVerification';

export type Attempt = { result: 'match' } | { result: 'mismatch'; received: string; receivedCode: string };

interface Options {
  device: KeyboardDevice;
  os: OsChoice;
  active: boolean;
  keyIndex: number | null;
  /** Key presses are only taken while this element is visible. */
  containerRef: RefObject<HTMLElement | null>;
}

export function useKeyConfirmation({ device, os, active, keyIndex, containerRef }: Options) {
  // Demo confirmations mean nothing, so they are never saved.
  const load = () => (device.isDemo ? emptyStore() : loadConfirmations(device.id));
  const [saved, setSaved] = useState(() => ({ deviceId: device.id, store: load() }));
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  const currentCodes = new Map(
    device.config.keys.map(key => [key.bIndex, device.getMapping(key.bIndex) ?? key.keyInfo.fw]),
  );

  // Adjust state while rendering: another keyboard, or keys that changed since confirmed.
  if (saved.deviceId !== device.id) {
    setSaved({ deviceId: device.id, store: load() });
  } else {
    const pruned = pruneStale(saved.store, currentCodes);
    if (pruned !== saved.store) setSaved({ deviceId: device.id, store: pruned });
  }

  useEffect(() => {
    if (!device.isDemo) saveConfirmations(saved.deviceId, saved.store);
  }, [device.isDemo, saved]);

  const currentFw = keyIndex === null ? undefined : currentCodes.get(keyIndex);
  const expected = currentFw === undefined ? null : getExpectedKey(currentFw);
  const isListening = active && expected !== null && attempt === null;

  const confirm = useCallback(
    (index: number, confirmation: Confirmation | null) => {
      setSaved(previous => ({
        ...previous,
        store: setConfirmation(previous.store, os, index, confirmation),
      }));
    },
    [os],
  );

  const expectedKey = JSON.stringify(expected);
  useEffect(() => {
    if (!isListening || keyIndex === null || currentFw === undefined) return;
    const target = getExpectedKey(currentFw);
    if (!target) return;

    // A focused button would otherwise react to Space or Enter.
    (document.activeElement as HTMLElement | null)?.blur?.();

    const onKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current?.offsetParent) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.repeat) return;

      const result = matchKeyPress(target, event);
      if (result === 'wait') return;
      if (result === 'match') {
        confirm(keyIndex, { fw: currentFw, method: 'pressed' });
        setAttempt({ result: 'match' });
      } else {
        confirm(keyIndex, null);
        setAttempt({ result: 'mismatch', received: describeKeyPress(event), receivedCode: event.code });
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isListening, keyIndex, currentFw, expectedKey, confirm, containerRef]);

  const marks = new Map(
    Object.entries(saved.store[os]).map(([index, { method }]) => [Number(index), method]),
  );

  return {
    marks,
    expected,
    attempt,
    isListening,
    resetAttempt: useCallback(() => setAttempt(null), []),
    confirmByHand: () => {
      if (keyIndex === null || currentFw === undefined) return;
      confirm(keyIndex, { fw: currentFw, method: 'manual' });
      setAttempt({ result: 'match' });
    },
    removeConfirmation: () => {
      if (keyIndex === null) return;
      confirm(keyIndex, null);
      setAttempt(null);
    },
  };
}
