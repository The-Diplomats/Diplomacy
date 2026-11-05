import { useEffect, useRef, useState } from 'react';

type Season = 'Spring' | 'Fall' | 'Winter';
type PhaseKind = 'Movement' | 'Retreat' | 'Builds';

type Phase = {
  id: string;
  season: Season;
  year: number;
  kind: PhaseKind;
  state: 'past' | 'current' | 'future';
};

const MOCK_PHASES: Phase[] = [
  { id: 'sp01m', season: 'Spring', year: 1901, kind: 'Movement', state: 'past' },
  { id: 'sp01r', season: 'Spring', year: 1901, kind: 'Retreat', state: 'past' },
  { id: 'fa01m', season: 'Fall', year: 1901, kind: 'Movement', state: 'past' },
  { id: 'fa01r', season: 'Fall', year: 1901, kind: 'Retreat', state: 'past' },
  { id: 'wi01b', season: 'Winter', year: 1901, kind: 'Builds', state: 'past' },
  { id: 'sp02m', season: 'Spring', year: 1902, kind: 'Movement', state: 'past' },
  { id: 'sp02r', season: 'Spring', year: 1902, kind: 'Retreat', state: 'past' },
  { id: 'fa02m', season: 'Fall', year: 1902, kind: 'Movement', state: 'past' },
  { id: 'fa02r', season: 'Fall', year: 1902, kind: 'Retreat', state: 'past' },
  { id: 'wi02b', season: 'Winter', year: 1902, kind: 'Builds', state: 'past' },
  { id: 'sp03m', season: 'Spring', year: 1903, kind: 'Movement', state: 'past' },
  { id: 'sp03r', season: 'Spring', year: 1903, kind: 'Retreat', state: 'past' },
  { id: 'fa03m', season: 'Fall', year: 1903, kind: 'Movement', state: 'past' },
  { id: 'fa03r', season: 'Fall', year: 1903, kind: 'Retreat', state: 'past' },
  { id: 'wi03b', season: 'Winter', year: 1903, kind: 'Builds', state: 'past' },
  { id: 'sp04m', season: 'Spring', year: 1904, kind: 'Movement', state: 'past' },
  { id: 'sp04r', season: 'Spring', year: 1904, kind: 'Retreat', state: 'past' },
  { id: 'fa04m', season: 'Fall', year: 1904, kind: 'Movement', state: 'current' },
];

const SEASON_BG: Record<Season, string> = {
  Spring: 'bg-gradient-to-b from-emerald-500/25 to-emerald-800/10',
  Fall: 'bg-gradient-to-b from-amber-500/25 to-orange-800/10',
  Winter: 'bg-gradient-to-b from-slate-400/25 to-slate-700/10',
};

export function PhaseTimelineDrawer() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; scrollLeft: number }>({ x: 0, scrollLeft: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    element.scrollLeft = element.scrollWidth;
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    startRef.current = { x: event.clientX, scrollLeft: element.scrollLeft };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) {
      return;
    }
    const onMove = (event: PointerEvent) => {
      const element = scrollRef.current;
      if (!element) {
        return;
      }
      const delta = event.clientX - startRef.current.x;
      element.scrollLeft = startRef.current.scrollLeft - delta;
    };
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging]);

  return (
    <div className="pointer-events-auto absolute inset-x-[2.5%] bottom-[3.5%] flex h-[112px] items-stretch rounded bg-card/95 py-2 pr-2 pl-[128px] shadow-xl ring-1 ring-border backdrop-blur-sm">
      <div
        ref={scrollRef}
        className={`thin-scroll flex flex-1 items-stretch overflow-x-auto select-none ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onPointerDown={onPointerDown}
      >
        <div className="ml-auto flex w-max items-stretch gap-2">
          {MOCK_PHASES.map((phase) => {
            const current = phase.state === 'current';
            return (
              <button
                key={phase.id}
                type="button"
                className={`relative flex h-full w-[180px] shrink-0 flex-col items-center justify-center rounded-lg border bg-clip-padding transition-shadow ${SEASON_BG[phase.season]} ${
                  current
                    ? 'border-2 border-foreground'
                    : 'border-border hover:border-foreground/40 hover:shadow-md hover:shadow-foreground/15'
                }`}
              >
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {phase.season}
                </span>
                <span className="text-3xl font-bold text-foreground">{phase.year}</span>
                <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
                  {phase.kind}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
