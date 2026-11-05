import { Crown } from 'lucide-react';
import { useRef, useState } from 'react';

import mapThumbnail from '../../../../maps/classical.svg?url';
import {
  AustriaFlag,
  EnglandFlag,
  FranceFlag,
  GermanyFlag,
  ItalyFlag,
  RussiaFlag,
  TurkeyFlag,
} from '../../../assets';
import { type Power, POWER_COLORS } from '../../map/powers';

type PlayablePower = Exclude<Power, 'neutral' | 'water'>;

const POWER_FLAG: Record<PlayablePower, React.FC<React.SVGProps<SVGSVGElement>>> = {
  england: EnglandFlag,
  france: FranceFlag,
  germany: GermanyFlag,
  italy: ItalyFlag,
  austria: AustriaFlag,
  russia: RussiaFlag,
  turkey: TurkeyFlag,
};

const POWERS: Array<{ id: PlayablePower; label: string }> = [
  { id: 'england', label: 'England' },
  { id: 'france', label: 'France' },
  { id: 'germany', label: 'Germany' },
  { id: 'italy', label: 'Italy' },
  { id: 'austria', label: 'Austria' },
  { id: 'russia', label: 'Russia' },
  { id: 'turkey', label: 'Turkey' },
];

type Size = 'sm' | 'lg';

const SIZE_CLASSES: Record<
  Size,
  {
    anchor: string;
    panel: string;
    tile: string;
    swatch: string;
    label: string;
    labelIcon: string;
    anchorIcon: string;
    anchorLabel: string;
  }
> = {
  sm: {
    anchor: 'h-[72px] w-[72px]',
    panel: 'h-[72px]',
    tile: 'w-[58px]',
    swatch: 'h-11 w-11',
    label: 'text-[10px]',
    labelIcon: 'h-3.5 w-3.5',
    anchorIcon: 'h-3.5 w-3.5',
    anchorLabel: 'text-[10px]',
  },
  lg: {
    anchor: 'h-[96px] w-[96px]',
    panel: 'h-[96px]',
    tile: 'w-[72px]',
    swatch: 'h-14 w-14',
    label: 'text-xs',
    labelIcon: 'h-4 w-4',
    anchorIcon: 'h-4 w-4',
    anchorLabel: 'text-xs',
  },
};

type Props = {
  activePower: Exclude<Power, 'neutral' | 'water'> | null;
  onSelect: (power: Exclude<Power, 'neutral' | 'water'> | null) => void;
  size?: Size;
  floatHover?: boolean;
};

export function PowersPanel({ activePower, onSelect, size = 'sm', floatHover = false }: Props) {
  const [hovered, setHovered] = useState(false);
  const activeColor = activePower ? POWER_COLORS[activePower].fill : null;
  const c = SIZE_CLASSES[size];

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setHovered(true);
  };
  const hide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(() => {
      setHovered(false);
      hideTimer.current = null;
    }, 180);
  };

  return (
    <div
      className="pointer-events-auto relative flex items-stretch gap-2"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`relative shrink-0 overflow-hidden rounded shadow-lg ring-2 ring-background transition-all hover:ring-4 ${c.anchor}`}
        style={activeColor ? { backgroundColor: activeColor } : undefined}
        aria-label="Powers"
      >
        {!activeColor && (
          <img
            src={mapThumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-x-0 bottom-1 flex items-center justify-center gap-1">
          <Crown className={`${c.anchorIcon} text-white drop-shadow`} />
          <span className={`${c.anchorLabel} font-semibold text-white drop-shadow`}>Powers</span>
        </div>
      </button>

      <div
        onMouseEnter={show}
        onMouseLeave={hide}
        className={`flex items-center gap-0.5 rounded bg-card/95 p-1 shadow-lg ring-2 ring-background backdrop-blur-sm transition-all duration-200 ${c.panel} ${
          floatHover ? 'absolute top-0 left-[calc(100%+8px)] z-20' : ''
        } ${hovered ? 'opacity-100' : 'pointer-events-none translate-x-[-6px] opacity-0'}`}
      >
        {POWERS.map((power) => {
          const active = activePower === power.id;
          const Flag = POWER_FLAG[power.id];
          return (
            <button
              key={power.id}
              type="button"
              onClick={() => onSelect(active ? null : power.id)}
              className={`group flex h-full flex-col items-center justify-center gap-0.5 rounded transition ${c.tile} ${
                active ? 'bg-accent' : ''
              }`}
              aria-label={power.label}
              aria-pressed={active}
            >
              <Flag
                className={`rounded shadow-sm ring-1 transition ${c.swatch} ${
                  active
                    ? 'ring-2 ring-foreground'
                    : 'ring-border group-hover:ring-2 group-hover:ring-foreground'
                }`}
                aria-hidden
              />
              <span className={`${c.label} font-medium text-card-foreground`}>{power.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
