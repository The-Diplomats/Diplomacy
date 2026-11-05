import { Download, History, LayoutGrid, Settings, Trophy, Users } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../../../components/ui/popover';

const TOOLS = [
  { key: 'standings', icon: Trophy, label: 'Standings' },
  { key: 'history', icon: History, label: 'History' },
  { key: 'players', icon: Users, label: 'Players' },
  { key: 'settings', icon: Settings, label: 'Settings' },
  { key: 'export', icon: Download, label: 'Export' },
] as const;

export function AppsDrawer() {
  return (
    <div className="pointer-events-auto">
      <Popover>
        <PopoverTrigger
          aria-label="Game tools"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card/95 text-foreground shadow-lg ring-1 ring-border backdrop-blur-sm transition hover:bg-card hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <LayoutGrid className="h-5 w-5" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 gap-3">
          <PopoverHeader>
            <PopoverTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Game tools
            </PopoverTitle>
          </PopoverHeader>
          <div className="grid grid-cols-3 gap-1">
            {TOOLS.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                className="flex flex-col items-center gap-1.5 rounded-lg p-2.5 transition hover:bg-accent focus:bg-accent focus:outline-none"
              >
                <Icon className="h-5 w-5 text-foreground" />
                <span className="text-[11px] font-medium text-foreground">{label}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
