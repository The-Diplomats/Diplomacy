import { ChevronsLeft, ChevronsRight, ScrollText } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';

type DraftOrder = {
  id: string;
  unit: string;
  from: string;
  action: string;
};

const DRAFT_ORDERS: DraftOrder[] = [
  { id: 'o1', unit: 'A', from: 'PAR', action: 'Hold' },
  { id: 'o2', unit: 'F', from: 'LON', action: 'Move to NTH' },
];

const TOTAL_UNITS = 7;

type Props = {
  expanded: boolean;
  onToggle: () => void;
};

export function GamePanel({ expanded, onToggle }: Props) {
  if (expanded) {
    return (
      <Card className="pointer-events-auto flex w-72 flex-col gap-0 overflow-hidden bg-card/95 p-0 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Orders</span>
            <span className="text-xs text-muted-foreground">
              {DRAFT_ORDERS.length}/{TOTAL_UNITS}
            </span>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label="Collapse">
            <ChevronsLeft />
          </Button>
        </div>
        <Separator />
        <div className="flex flex-col gap-2 px-4 py-3">
          {DRAFT_ORDERS.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-md bg-muted px-3 py-2"
            >
              <span className="font-mono text-xs text-foreground">
                {order.unit} {order.from}
              </span>
              <span className="text-xs text-muted-foreground">{order.action}</span>
            </div>
          ))}
          {Array.from({ length: TOTAL_UNITS - DRAFT_ORDERS.length }, (_, index) => (
            <div
              key={`pending-${index}`}
              className="flex items-center rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground italic"
            >
              Pending order
            </div>
          ))}
        </div>
        <Separator />
        <div className="px-4 py-3">
          <Button className="w-full" size="sm">
            Submit Orders
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Expand orders"
      className="pointer-events-auto flex w-10 flex-col items-center gap-1.5 rounded-lg bg-card/95 py-2.5 shadow-lg ring-1 ring-border backdrop-blur-sm transition hover:bg-card hover:shadow-xl"
    >
      <ScrollText className="h-5 w-5 text-foreground" />
      <span
        className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
        style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
      >
        Orders
      </span>
      <span className="text-[10px] font-bold tabular-nums text-foreground">
        {DRAFT_ORDERS.length}/{TOTAL_UNITS}
      </span>
      <ChevronsRight className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}
