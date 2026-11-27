import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Attempt } from '../hooks/useKeyConfirmation';
import { describeKeyPress, SWAPPABLE_CODES, type ExpectedKey } from '../utils/keyVerification';
import type { OsChoice } from '../utils/keyLabels';

interface ConfirmationPanelProps {
  os: OsChoice;
  /** Name of what the selected key should do, or `null` with no key selected. */
  keyName: string | null;
  expected: ExpectedKey | null;
  attempt: Attempt | null;
  isConfirmed: boolean;
  isRemapped: boolean;
  confirmedCount: number;
  totalCount: number;
  onRetry: () => void;
  onConfirmByHand: () => void;
  onRemove: () => void;
}

export function ConfirmationPanel({
  os, keyName, expected, attempt, isConfirmed, isRemapped, confirmedCount, totalCount,
  onRetry, onConfirmByHand, onRemove,
}: ConfirmationPanelProps) {
  const modeName = os === 'mac' ? 'Mac' : 'Windows';

  let message;
  if (keyName === null) {
    message = <p>Click a key in the drawing, then press that same key on your keyboard.</p>;
  } else if (isRemapped) {
    message = <p>This key is remapped ({keyName}), so it does not need confirmation.</p>;
  } else if (attempt?.result === 'mismatch' && expected) {
    message = (
      <div className="space-y-1">
        <p className="font-semibold text-destructive">
          Not confirmed: received {attempt.received}, expected {describeKeyPress(expected)}.
        </p>
        {SWAPPABLE_CODES.has(expected.code) && SWAPPABLE_CODES.has(attempt.receivedCode) && (
          <p>macOS can swap these two keys. If the key types what you expect, you can mark it as confirmed.</p>
        )}
      </div>
    );
  } else if (isConfirmed) {
    message = <p className="font-semibold">{keyName}: confirmed.</p>;
  } else if (!expected) {
    message = <p>The browser cannot detect {keyName}. Check it yourself, then mark it as confirmed.</p>;
  } else {
    message = (
      <p>
        <strong>Press {keyName} on your keyboard now.</strong> Expected: {describeKeyPress(expected)}.
        While waiting, the page captures your key presses.
      </p>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-card-foreground">Confirming keys in {modeName} mode</h3>
          <span className="text-sm text-muted-foreground">
            {confirmedCount} of {totalCount} confirmed
          </span>
        </div>
        <div className="text-sm text-card-foreground" aria-live="polite">{message}</div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onRetry} disabled={keyName === null || attempt === null} size="sm" variant="secondary">
            Try again
          </Button>
          <Button onClick={onConfirmByHand} disabled={keyName === null || isConfirmed || isRemapped} size="sm" variant="outline">
            Mark as confirmed
          </Button>
          <Button onClick={onRemove} disabled={!isConfirmed} size="sm" variant="outline">
            Remove confirmation
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Set your keyboard to {modeName} mode: the app cannot detect it. Change &quot;Key names&quot; to confirm the
          other mode. Press only the selected key: the app cannot tell which physical key sent a code.
          Nothing is written to the keyboard here.
        </p>
      </CardContent>
    </Card>
  );
}
