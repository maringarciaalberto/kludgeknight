import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LAYOUT_CHOICES,
  OS_CHOICES,
  type LayoutChoice,
  type OsChoice,
} from '../utils/keyLabels';

const LAYOUT_NAMES: Record<LayoutChoice, string> = {
  auto: 'Auto',
  US: 'US',
  ES: 'Spanish',
  DE: 'German',
  FR: 'French',
};

const OS_NAMES: Record<OsChoice, string> = {
  windows: 'Windows',
  mac: 'Mac',
};

interface LabelSelectorsProps {
  layout: LayoutChoice;
  os: OsChoice;
  onLayoutChange: (choice: LayoutChoice) => void;
  onOsChange: (choice: OsChoice) => void;
}

export function LabelSelectors({ layout, os, onLayoutChange, onOsChange }: LabelSelectorsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-card-foreground">Layout</span>
        <Select value={layout} onValueChange={(value) => onLayoutChange(value as LayoutChoice)}>
          <SelectTrigger className="w-32" aria-label="Keyboard layout language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LAYOUT_CHOICES.map((choice) => (
              <SelectItem key={choice} value={choice}>
                {LAYOUT_NAMES[choice]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-card-foreground">Key names</span>
        <Select value={os} onValueChange={(value) => onOsChange(value as OsChoice)}>
          <SelectTrigger className="w-32" aria-label="Operating system key names">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OS_CHOICES.map((choice) => (
              <SelectItem key={choice} value={choice}>
                {OS_NAMES[choice]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        Only changes key names and their order on screen, not what is sent to the keyboard. What a key types also depends on your computer&apos;s settings.
      </p>
    </div>
  );
}
