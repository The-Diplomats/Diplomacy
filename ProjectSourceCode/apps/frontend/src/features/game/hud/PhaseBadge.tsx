import { Separator } from '../../../components/ui/separator';

export function PhaseBadge() {
  return (
    <div className="pointer-events-auto flex items-stretch overflow-hidden rounded-full bg-card/95 shadow-lg ring-1 ring-border backdrop-blur-sm">
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Spring 1901
        </span>
        <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
        <span className="text-xs font-bold text-card-foreground">Movement</span>
      </div>
      <div className="flex items-center gap-2 bg-foreground px-4 py-2 text-background">
        <span className="text-[10px] tracking-wider text-background/60 uppercase">Deadline</span>
        <span className="font-mono text-sm font-bold tabular-nums">04:32</span>
      </div>
    </div>
  );
}
