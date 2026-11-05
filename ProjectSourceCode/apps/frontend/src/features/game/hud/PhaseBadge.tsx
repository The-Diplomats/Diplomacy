import { Separator } from '../../../components/ui/separator';

export function PhaseBadge() {
  return (
    <div className="pointer-events-auto flex items-stretch overflow-hidden rounded-full bg-card/95 shadow-xl ring-1 ring-border backdrop-blur-sm">
      <div className="flex items-center gap-2 px-5 py-2.5">
        <span className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          Spring 1901
        </span>
        <Separator orientation="vertical" className="data-[orientation=vertical]:h-5" />
        <span className="text-sm font-bold text-card-foreground">Movement</span>
      </div>
      <div className="flex items-center gap-2 bg-foreground px-5 py-2.5 text-background">
        <span className="text-xs tracking-wider text-background/60 uppercase">Deadline</span>
        <span className="font-mono text-base font-bold tabular-nums">04:32</span>
      </div>
    </div>
  );
}
