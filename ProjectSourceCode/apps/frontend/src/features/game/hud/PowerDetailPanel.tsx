import { X } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';
import { type Power, POWER_COLORS } from '../../map/powers';

type Props = {
  power: Exclude<Power, 'neutral' | 'water'>;
  onClose: () => void;
};

const POWER_LABELS: Record<Exclude<Power, 'neutral' | 'water'>, string> = {
  england: 'England',
  france: 'France',
  germany: 'Germany',
  italy: 'Italy',
  austria: 'Austria-Hungary',
  russia: 'Russia',
  turkey: 'Turkey',
};

export function PowerDetailPanel({ power, onClose }: Props) {
  const colors = POWER_COLORS[power];
  return (
    <Card className="pointer-events-auto w-72 bg-card/95 shadow-xl backdrop-blur-sm">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div
          className="h-6 w-6 rounded-full shadow ring-2 ring-background"
          style={{ backgroundColor: colors.fill }}
        />
        <CardTitle className="flex-1 text-sm font-bold">{POWER_LABELS[power]}</CardTitle>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
          <X />
        </Button>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-3 pt-3">
        <div>
          <div className="text-xs tracking-wider text-muted-foreground uppercase">Player</div>
          <div className="text-sm font-medium text-card-foreground">vacant</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs tracking-wider text-muted-foreground uppercase">Centers</div>
            <div className="text-2xl font-bold text-card-foreground">3</div>
          </div>
          <div>
            <div className="text-xs tracking-wider text-muted-foreground uppercase">Units</div>
            <div className="text-2xl font-bold text-card-foreground">3</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
