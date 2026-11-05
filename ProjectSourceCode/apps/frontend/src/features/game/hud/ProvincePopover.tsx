import { ArrowRight, Hand, HandMetal, Ship, X } from 'lucide-react';

import {
  AustriaFlag,
  EnglandFlag,
  FranceFlag,
  GermanyFlag,
  ItalyFlag,
  RussiaFlag,
  TurkeyFlag,
} from '../../../assets';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';
import { type Power, POWER_COLORS, PROVINCE_OWNERS } from '../../map/powers';

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

const POWER_LABELS: Record<PlayablePower, string> = {
  england: 'England',
  france: 'France',
  germany: 'Germany',
  italy: 'Italy',
  austria: 'Austria-Hungary',
  russia: 'Russia',
  turkey: 'Turkey',
};

type Props = {
  provinceId: string;
  x: number;
  y: number;
  onClose: () => void;
};

export function ProvincePopover({ provinceId, x, y, onClose }: Props) {
  const owner = PROVINCE_OWNERS[provinceId] ?? 'neutral';
  const playable = owner !== 'neutral' && owner !== 'water' ? (owner as PlayablePower) : null;
  const Flag = playable ? POWER_FLAG[playable] : null;
  const ownerColor = playable ? POWER_COLORS[playable].fill : null;
  const ownerLabel = playable ? POWER_LABELS[playable] : 'Neutral';

  return (
    <div
      className="pointer-events-auto absolute z-30"
      style={{ left: x, top: y, transform: 'translate(-50%, calc(-100% - 12px))' }}
    >
      <Card
        size="sm"
        className="w-72 gap-0 overflow-hidden bg-card/95 p-0 shadow-xl backdrop-blur-sm"
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={ownerColor ? { backgroundColor: `${ownerColor}20` } : undefined}
        >
          <div className="flex items-center gap-3">
            {Flag ? (
              <Flag className="h-10 w-10 shrink-0 rounded ring-1 ring-border shadow-sm" />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded bg-muted ring-1 ring-border" />
            )}
            <div className="flex flex-col">
              <div className="text-base font-bold text-foreground">{provinceId.toUpperCase()}</div>
              <div className="text-xs text-muted-foreground">{ownerLabel}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0"
          >
            <X />
          </Button>
        </div>
        <Separator />
        <div className="grid grid-cols-4 gap-1 p-2">
          <ActionButton icon={<ArrowRight />} label="Move" />
          <ActionButton icon={<Hand />} label="Hold" />
          <ActionButton icon={<HandMetal />} label="Support" />
          <ActionButton icon={<Ship />} label="Convoy" />
        </div>
      </Card>
    </div>
  );
}

function ActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-foreground transition hover:bg-accent"
    >
      <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
