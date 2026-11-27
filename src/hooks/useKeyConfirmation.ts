import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { KeyboardDevice } from '../models/KeyboardDevice';
import type { OsChoice } from '../utils/keyLabels';
import { dropRemapped, setConfirmed, updateConfirmations } from '../utils/confirmationStorage';
import { getRemappedKeys } from '../utils/keyState';
import { describeKeyPress, getExpectedKey, matchKeyPress } from '../utils/keyVerification';
import { useConfirmations } from './useConfirmations';

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
  const confirmations = useConfirmations(device);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const persist = !device.isDemo;
  const remapped = getRemappedKeys(device);

  // Wait for the write to finish: a failed one rolls the mappings back.
  useEffect(() => {
    if (device.isMappingLoading) return;
    updateConfirmations(device.id, persist, current => dropRemapped(current, getRemappedKeys(device)));
  });

  const isRemappedKey = keyIndex !== null && remapped.has(keyIndex);
  const defaultCode = device.config.keys.find(key => key.bIndex === keyIndex)?.keyInfo.fw;
  const expected = defaultCode === undefined || isRemappedKey ? null : getExpectedKey(defaultCode);
  const isListening = active && expected !== null && attempt === null;

  const confirm = useCallback(
    (index: number, confirmed: boolean) => {
      updateConfirmations(device.id, persist, current => setConfirmed(current, os, index, confirmed));
    },
    [device.id, persist, os],
  );

  useEffect(() => {
    if (!isListening || keyIndex === null || defaultCode === undefined) return;
    const target = getExpectedKey(defaultCode);
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
      confirm(keyIndex, result === 'match');
      setAttempt(
        result === 'match'
          ? { result }
          : { result, received: describeKeyPress(event), receivedCode: event.code },
      );
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isListening, keyIndex, defaultCode, confirm, containerRef]);

  return {
    marks: new Set(confirmations[os].filter(index => !remapped.has(index))),
    expected,
    attempt,
    isRemappedKey,
    resetAttempt: useCallback(() => setAttempt(null), []),
    confirmByHand: () => {
      if (keyIndex === null || isRemappedKey) return;
      confirm(keyIndex, true);
      setAttempt({ result: 'match' });
    },
    removeConfirmation: () => {
      if (keyIndex === null) return;
      confirm(keyIndex, false);
      setAttempt(null);
    },
  };
}
