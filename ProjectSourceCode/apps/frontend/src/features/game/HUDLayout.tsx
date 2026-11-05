import { useState } from 'react';

import { Themed } from '../../components/Themed';
import { MapCanvas } from '../map/MapCanvas';
import type { Power } from '../map/powers';
import { AppsDrawer } from './hud/AppsDrawer';
import { ChatToggle } from './hud/ChatToggle';
import { PhaseBadge } from './hud/PhaseBadge';
import { PhaseTimelineDrawer } from './hud/PhaseTimelineDrawer';
import { PhaseTimelineTrigger } from './hud/PhaseTimelineTrigger';
import { PowerDetailPanel } from './hud/PowerDetailPanel';
import { PowersPanel } from './hud/PowersPanel';
import { UserMenu } from './hud/UserMenu';
import { ZoomControls } from './hud/ZoomControls';
import { HUDSlot } from './HUDSlot';

type PlayablePower = Exclude<Power, 'neutral' | 'water'>;

export function HUDLayout() {
  const [activePower, setActivePower] = useState<PlayablePower | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black">
      <div
        className="relative"
        style={{
          aspectRatio: '2120 / 1427',
          width: 'min(100vw, calc(100vh * 2120 / 1427))',
          height: 'min(100vh, calc(100vw * 1427 / 2120))',
        }}
      >
        <MapCanvas />
        <Themed className="absolute inset-0 pointer-events-none">
          <HUDSlot position="top-right">
            <div className="flex flex-row items-center gap-3">
              <PhaseBadge />
              <AppsDrawer />
              <UserMenu />
            </div>
          </HUDSlot>

          {timelineOpen && <PhaseTimelineDrawer />}

          <HUDSlot
            position="bottom-left"
            className={`transition-transform duration-200 ease-out ${
              timelineOpen ? '-translate-y-2 translate-x-2' : ''
            }`}
          >
            {activePower && (
              <PowerDetailPanel power={activePower} onClose={() => setActivePower(null)} />
            )}
            <PowersPanel
              activePower={activePower}
              onSelect={setActivePower}
              size={timelineOpen ? 'lg' : 'sm'}
              floatHover={timelineOpen}
            />
          </HUDSlot>

          <HUDSlot
            position="bottom-right"
            className={`transition-transform duration-200 ease-out ${
              timelineOpen ? '-translate-y-[120px]' : ''
            }`}
          >
            <ZoomControls />
            <ChatToggle unread={3} />
            <PhaseTimelineTrigger
              open={timelineOpen}
              onClick={() => setTimelineOpen(!timelineOpen)}
            />
          </HUDSlot>
        </Themed>
      </div>
    </div>
  );
}
