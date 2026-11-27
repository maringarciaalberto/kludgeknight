import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '../hooks/useToast';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import type { KeyboardDevice } from '../models/KeyboardDevice';
import type { FirmwareCode } from '../types/keycode';
import { getLocalizedKeyName } from '../utils/localeLabels';
import {
  MAX_BACKUP_BYTES,
  getBackupChanges,
  getBackupFileName,
  getBackupWarnings,
  parseBackup,
  serializeBackup,
} from '../utils/keymapBackup';

function download(fileName: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function BackupControls({ device }: { device: KeyboardDevice }) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ deviceId: string; mappings: Map<number, FirmwareCode> } | null>(null);
  const isDemo = !!device.isDemo;
  const isLoading = device.isMappingLoading;
  const { config } = device;

  const handleExport = () => {
    const now = new Date();
    download(getBackupFileName(config, now), serializeBackup(config, device.mappings, now));
  };

  const handleFile = async (file: File) => {
    if (file.size > MAX_BACKUP_BYTES) {
      toast.showError('That file is too large to be a key mapping backup.');
      return;
    }
    const result = parseBackup(await file.text(), config);
    if (result.ok) setPending({ deviceId: device.id, mappings: result.mappings });
    else toast.showError(result.error);
  };

  const handleImport = async () => {
    if (!pending || pending.deviceId !== device.id) return;
    setPending(null);
    try {
      await device.applyMappings(pending.mappings);
      toast.showSuccess(isDemo ? 'Backup imported (Simulated)' : 'Backup imported');
    } catch (err) {
      toast.showError(ERROR_MESSAGES.IMPORT_BACKUP_FAILED);
      console.error(err);
    }
  };

  const renderDialog = () => {
    if (!pending || pending.deviceId !== device.id) return null;

    const changes = getBackupChanges(config, device.mappings, pending.mappings);
    const warnings = getBackupWarnings(config, pending.mappings);
    const name = (fw: FirmwareCode) => getLocalizedKeyName(fw, config.locale);

    return (
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="import-backup-title"
      >
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 space-y-3">
            <h3 id="import-backup-title" className="text-lg font-semibold">Import this backup?</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                This writes the whole keymap to the keyboard, replacing what is on it. The backup has{' '}
                {pending.mappings.size} remapped {pending.mappings.size === 1 ? 'key' : 'keys'}.
              </p>
              {pending.mappings.size === 0 && (
                <p><strong>It has no remaps: every key goes back to its default.</strong></p>
              )}
              {changes.length > 0 ? (
                <>
                  <p>Changes compared with what this app has saved:</p>
                  <ul className="max-h-40 overflow-y-auto border border-border rounded p-2">
                    {changes.map(change => (
                      <li key={change.keyIndex}>
                        <strong>{name(change.defaultCode)}</strong>: {name(change.from)} → {name(change.to)}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>No differences with what this app has saved. The keyboard itself cannot be read.</p>
              )}
              {warnings.has('replace-fn') && (
                <p className="text-destructive">
                  <strong>This backup replaces the Fn key.</strong> That is risky and may be irreversible:
                  it has not been verified that &quot;Reset All Keys to Default&quot; can undo it.
                </p>
              )}
              {warnings.has('assign-fn') && (
                <p>It assigns Fn to another key, which probably will not work as a real Fn key.</p>
              )}
              {warnings.has('replace-modifier') && (
                <p>It remaps Ctrl, Alt or Win/Cmd keys, which will then do the same in Mac and Windows modes.</p>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Button onClick={handleExport} variant="secondary" size="sm">Export current first</Button>
              <Button onClick={() => setPending(null)} variant="outline" size="sm">Cancel</Button>
              <Button
                onClick={handleImport}
                disabled={isLoading}
                variant={warnings.has('replace-fn') ? 'destructive' : 'default'}
                size="sm"
              >
                Write to keyboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={handleExport} disabled={isLoading} variant="outline" size="sm">
        Export backup
      </Button>
      <Button onClick={() => inputRef.current?.click()} disabled={isLoading} variant="outline" size="sm">
        {isDemo && <span className="text-primary mr-1">[DEMO]</span>}
        Import backup…
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = ''; // allow picking the same file again
          if (file) void handleFile(file);
        }}
      />
      {renderDialog()}
    </div>
  );
}
