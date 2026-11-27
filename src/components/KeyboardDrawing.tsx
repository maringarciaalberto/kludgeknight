import type { KeyboardDevice } from '../models/KeyboardDevice';
import type { Key } from '../types/keyboard';
import { KEY_MAP } from '../types/keycode';
import type { CapRect, KeyboardGeometry } from '../utils/keyboardGeometry';
import { getLayoutLabel } from '../utils/keyboardLayout';
import { isRemapped } from '../utils/keyState';
import { getCapLegend, getKeyInfoLabel, getMappingLabel, type OsChoice } from '../utils/keyLabels';

interface KeyboardDrawingProps {
  device: KeyboardDevice;
  geometry: KeyboardGeometry;
  onKeyClick?: (keyIndex: number) => void;
  selectedKeyIndex?: number;
  locale?: string;
  os: OsChoice;
  confirmations?: ReadonlySet<number>;
}

const MAX_FONT_SIZE = 12;
const MIN_FONT_SIZE = 7.5;
/** Approximate width of a character, relative to the font size. */
const CHAR_WIDTH = 0.58;

function Legend({ cap, text }: { cap: CapRect; text: string }) {
  const available = cap.width - 8;
  const fitting = available / (text.length * CHAR_WIDTH);
  const fontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, fitting));
  const squeeze = text.length * CHAR_WIDTH * fontSize > available;

  return (
    <text
      className="kb-legend"
      x={cap.x + cap.width / 2}
      y={cap.y + cap.height / 2 - 1}
      fontSize={fontSize}
      textAnchor="middle"
      dominantBaseline="central"
      {...(squeeze ? { textLength: available, lengthAdjust: 'spacingAndGlyphs' as const } : {})}
    >
      {text}
    </text>
  );
}

export function KeyboardDrawing({ device, geometry, onKeyClick, selectedKeyIndex, locale, os, confirmations }: KeyboardDrawingProps) {
  const { bounds, caps } = geometry;
  const keysByIndex = new Map<number, Key>(device.config.keys.map(key => [key.bIndex, key]));

  const renderCap = (cap: CapRect) => {
    const key = keysByIndex.get(cap.bIndex);
    if (!key) return null;

    const mapping = device.getMapping(cap.bIndex);
    const remapped = isRemapped(key, mapping);
    const isSelected = selectedKeyIndex === cap.bIndex;

    const keyInfo = remapped ? Object.values(KEY_MAP).find(k => k.fw === mapping) : key.keyInfo;
    const fwCode = mapping ?? key.keyInfo.fw;
    const legend = getCapLegend(fwCode, keyInfo, keyInfo && getLayoutLabel(keyInfo.vk), locale, os);
    const originalName = getKeyInfoLabel(key.keyInfo, locale, os);
    const isConfirmed = !remapped && (confirmations?.has(cap.bIndex) ?? false);
    const description = remapped
      ? `${originalName}, remapped to ${getMappingLabel(fwCode, locale, os)}`
      : `${originalName}, ${isConfirmed ? 'confirmed' : 'unconfirmed'}`;

    return (
      <g
        key={cap.bIndex}
        className={`kb-key ${remapped ? 'kb-key-remapped' : 'kb-key-default'} ${isConfirmed ? 'kb-key-confirmed' : ''} ${isSelected ? 'kb-key-selected' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={description}
        aria-pressed={isSelected}
        onClick={() => onKeyClick?.(cap.bIndex)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onKeyClick?.(cap.bIndex);
          }
        }}
      >
        <title>{description}</title>
        {/* Side of the keycap, then its slightly raised top */}
        <rect className="kb-cap-side" x={cap.x} y={cap.y} width={cap.width} height={cap.height} rx={5} />
        <rect className="kb-cap-top" x={cap.x + 2} y={cap.y + 1} width={cap.width - 4} height={cap.height - 5} rx={4} />
        <Legend cap={cap} text={legend} />
        {isConfirmed && (
          <g className="kb-badge" transform={`translate(${cap.x + cap.width - 8} ${cap.y + 7})`}>
            <circle r={4.5} />
            <path d="M-2.2 0.2 L-0.6 1.8 L2.3 -1.6" />
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="border border-border rounded p-4 bg-card kb-drawing">
      <style>{`
        .kb-drawing { --kb-remapped: #16a34a; }
        .dark .kb-drawing { --kb-remapped: #4ade80; }
        .kb-case { fill: color-mix(in srgb, var(--foreground) 14%, var(--card)); stroke: var(--border); }
        .kb-key { cursor: pointer; outline: none; }
        .kb-cap-side { fill: color-mix(in srgb, var(--foreground) 26%, var(--card)); }
        .kb-cap-top { fill: var(--card); stroke: color-mix(in srgb, var(--foreground) 12%, transparent); }
        .kb-legend { fill: var(--foreground); pointer-events: none; user-select: none; }
        .kb-key-default .kb-legend { opacity: 0.52; }
        .dark .kb-key-default .kb-legend { opacity: 0.42; }
        .kb-key:hover .kb-cap-top { fill: color-mix(in srgb, var(--primary) 12%, var(--card)); }
        .kb-key-remapped .kb-cap-top { fill: color-mix(in srgb, var(--kb-remapped) 28%, var(--card)); stroke: var(--kb-remapped); stroke-width: 1.5; }
        .kb-key-remapped .kb-legend { font-weight: 700; }
        .kb-key-confirmed .kb-legend { opacity: 1; font-weight: 600; }
        .dark .kb-key-confirmed .kb-legend { opacity: 1; }
        .kb-key-confirmed .kb-cap-top { stroke: var(--foreground); stroke-width: 1.5; }
        .kb-badge { pointer-events: none; }
        .kb-badge path { fill: none; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
        .kb-badge circle { fill: var(--foreground); }
        .kb-badge path { stroke: var(--card); }
        .kb-key-selected .kb-cap-side { fill: var(--primary); }
        .kb-key-selected .kb-cap-top { stroke: var(--primary); stroke-width: 2.5; }
        .kb-key-selected .kb-legend { opacity: 1; }
        .kb-key:focus-visible .kb-cap-top { stroke: var(--primary); stroke-width: 2.5; stroke-dasharray: 4 2; }
        .kb-swatch-default { background: var(--card); border-color: var(--border); }
        .kb-swatch-remapped { background: color-mix(in srgb, var(--kb-remapped) 28%, var(--card)); border-color: var(--kb-remapped); }
        .kb-swatch-selected { background: var(--card); border: 2px solid var(--primary); }
      `}</style>
      <svg
        viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
        className="w-full h-auto"
        style={{ maxHeight: '400px' }}
        role="group"
        aria-label={`${device.config.name} keys`}
      >
        <rect className="kb-case" x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} rx={12} />
        {caps.map(renderCap)}
      </svg>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-card-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border rounded-sm kb-swatch-default"></div>
          <span>Unconfirmed (faded)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border rounded-sm kb-swatch-remapped"></div>
          <span>Remapped</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm kb-swatch-selected"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">✓</span>
          <span>Confirmed</span>
        </div>
      </div>
      {os === 'mac' && (
        <p className="mt-2 text-xs text-muted-foreground">
          Default names follow the model&apos;s configuration. In the keyboard&apos;s Mac mode, the modifier positions may differ.
        </p>
      )}
    </div>
  );
}
