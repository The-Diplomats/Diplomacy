import { ChevronsDown, ChevronsUp, Clock } from 'lucide-react';

type Season = 'Spring' | 'Fall' | 'Winter';

type PreviewPhase = { id: string; season: Season; year: number; current?: boolean };

const PREVIEW: PreviewPhase[] = [
  { id: 'wi03', season: 'Winter', year: 1903 },
  { id: 'sp04', season: 'Spring', year: 1904 },
  { id: 'fa04', season: 'Fall', year: 1904, current: true },
];

const SEASON_LABEL: Record<Season, string> = {
  Spring: 'SP',
  Fall: 'FA',
  Winter: 'WI',
};

const SEASON_BG: Record<Season, string> = {
  Spring: 'bg-gradient-to-br from-emerald-500/25 to-emerald-800/10',
  Fall: 'bg-gradient-to-br from-amber-500/25 to-orange-800/10',
  Winter: 'bg-gradient-to-br from-slate-400/25 to-slate-700/10',
};

type Props = {
  open: boolean;
  onClick: () => void;
};

export function PhaseTimelineTrigger({ open, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Collapse phase timeline' : 'Open phase timeline'}
      className="pointer-events-auto flex items-center gap-1 rounded-full bg-card/95 p-1.5 pl-3 text-card-foreground shadow-lg ring-1 ring-border backdrop-blur-sm transition hover:bg-card hover:shadow-xl"
    >
      <Clock className="h-4 w-4 text-muted-foreground" />
      {open ? (
        <span className="px-2 text-sm font-semibold">Timeline</span>
      ) : (
        PREVIEW.map((phase) => (
          <div
            key={phase.id}
            className={`flex h-7 w-10 items-center justify-center rounded ring-1 ${SEASON_BG[phase.season]} ${
              phase.current ? 'ring-2 ring-foreground' : 'ring-border'
            }`}
          >
            <span className="text-[9px] font-semibold tracking-wider text-foreground">
              {SEASON_LABEL[phase.season]} {String(phase.year).slice(-2)}
            </span>
          </div>
        ))
      )}
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-foreground">
        {open ? <ChevronsDown className="h-4 w-4" /> : <ChevronsUp className="h-4 w-4" />}
      </span>
    </button>
  );
}
