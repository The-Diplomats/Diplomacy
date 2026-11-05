import { Leaf, Swords, Timer } from 'lucide-react';

export function PhaseBadge() {
  return (
    <div className="pointer-events-auto flex items-stretch gap-1.5">
      <div className="flex h-9 items-center gap-1.5 rounded-full bg-card/95 px-3 shadow-lg ring-1 ring-border backdrop-blur-sm">
        <Leaf className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Fall 1904
        </span>
      </div>
      <div className="flex h-9 items-center gap-1.5 rounded-full bg-card/95 px-3 shadow-lg ring-1 ring-border backdrop-blur-sm">
        <Swords className="h-3.5 w-3.5 text-card-foreground" />
        <span className="text-xs font-bold text-card-foreground">Movement</span>
      </div>
      <div className="flex h-9 items-center gap-1.5 rounded-full bg-foreground px-3 text-background shadow-lg backdrop-blur-sm">
        <Timer className="h-3.5 w-3.5 text-background/80" />
        <span className="text-[10px] tracking-wider text-background/60 uppercase">Deadline</span>
        <span className="font-mono text-sm font-bold tabular-nums">04:32</span>
      </div>
    </div>
  );
}
