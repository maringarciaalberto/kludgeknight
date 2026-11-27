/**
 * Backup files for key mappings.
 *
 * The keyboard cannot be read back, so a backup holds what the app has saved.
 * Imported values are written to hardware, so the file is validated strictly:
 * only known keys of the same model and key codes the app itself can send.
 */

import { z } from 'zod';
import { KEY_MAP, type FirmwareCode } from '../types/keycode';
import type { KeyboardConfig } from '../types/keyboard';
import { getRemapWarning, type RemapWarning } from './riskyRemap';

const BACKUP_KIND = 'kludgeknight-keymap-backup';
const BACKUP_VERSION = 1;
/** A full backup is a few kilobytes. */
export const MAX_BACKUP_BYTES = 100_000;

const BackupSchema = z.object({
  kind: z.literal(BACKUP_KIND),
  version: z.literal(BACKUP_VERSION),
  pid: z.string(),
  keyboardName: z.string(),
  exportedAt: z.string(),
  /** [key index, firmware code]. Required: a missing list must never mean "reset". */
  mappings: z.array(z.tuple([z.number().int(), z.number().int()])),
});

export function serializeBackup(
  config: KeyboardConfig,
  mappings: ReadonlyMap<number, FirmwareCode>,
  exportedAt: Date,
): string {
  const backup: z.infer<typeof BackupSchema> = {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    pid: config.pid,
    keyboardName: config.name,
    exportedAt: exportedAt.toISOString(),
    mappings: [...mappings].sort(([a], [b]) => a - b),
  };
  return JSON.stringify(backup, null, 2);
}

export function getBackupFileName(config: KeyboardConfig, exportedAt: Date): string {
  const name = config.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  return `kludgeknight-${name}-${exportedAt.toISOString().slice(0, 10)}.json`;
}

export type ParsedBackup =
  | { ok: true; mappings: Map<number, FirmwareCode> }
  | { ok: false; error: string };

export function parseBackup(json: string, config: KeyboardConfig): ParsedBackup {
  const fail = (error: string): ParsedBackup => ({ ok: false, error });

  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return fail('That file is not valid JSON.');
  }

  const result = BackupSchema.safeParse(data);
  if (!result.success) return fail('That file is not a Kludge Knight key mapping backup.');

  const { pid, keyboardName, mappings } = result.data;
  // Key indexes are layout specific, so another model's backup would hit the wrong keys.
  if (pid.toLowerCase() !== config.pid.toLowerCase()) {
    return fail(`This backup is for another keyboard (${keyboardName}), so it cannot be imported.`);
  }

  const knownKeys = new Set(config.keys.map(key => key.bIndex));
  const knownCodes = new Set([
    ...Object.values(KEY_MAP).map(info => info.fw),
    ...config.keys.map(key => key.keyInfo.fw),
  ]);
  const parsed = new Map<number, FirmwareCode>();
  for (const [keyIndex, fw] of mappings) {
    if (!knownKeys.has(keyIndex)) return fail(`The backup refers to an unknown key (${keyIndex}).`);
    if (!knownCodes.has(fw)) return fail(`The backup contains an unknown key code (${fw}).`);
    if (parsed.has(keyIndex)) return fail(`The backup lists key ${keyIndex} twice.`);
    parsed.set(keyIndex, fw);
  }
  return { ok: true, mappings: parsed };
}

export interface BackupChange {
  keyIndex: number;
  defaultCode: FirmwareCode;
  from: FirmwareCode;
  to: FirmwareCode;
}

/** Keys that would change, compared with what the app currently has saved. */
export function getBackupChanges(
  config: KeyboardConfig,
  current: ReadonlyMap<number, FirmwareCode>,
  incoming: ReadonlyMap<number, FirmwareCode>,
): BackupChange[] {
  return config.keys.flatMap(({ bIndex, keyInfo }) => {
    const from = current.get(bIndex) ?? keyInfo.fw;
    const to = incoming.get(bIndex) ?? keyInfo.fw;
    return from === to ? [] : [{ keyIndex: bIndex, defaultCode: keyInfo.fw, from, to }];
  });
}

/** The kinds of risky remaps a backup contains, whether or not they are new. */
export function getBackupWarnings(
  config: KeyboardConfig,
  incoming: ReadonlyMap<number, FirmwareCode>,
): Set<RemapWarning> {
  const warnings = config.keys.flatMap(({ bIndex, keyInfo }) => {
    const target = incoming.get(bIndex);
    const warning = target === undefined ? null : getRemapWarning(keyInfo.fw, target);
    return warning ? [warning] : [];
  });
  return new Set(warnings);
}
