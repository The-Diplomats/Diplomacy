import { useRef, useState } from 'react';

import { Themed } from '../../components/Themed';
import { MapCanvas } from '../map/MapCanvas';
import type { Power } from '../map/powers';
import { AppsDrawer } from './hud/AppsDrawer';
import { ChatDrawer } from './hud/ChatDrawer';
import { ChatToggle } from './hud/ChatToggle';
import { GamePanel } from './hud/GamePanel';
import { PhaseBadge } from './hud/PhaseBadge';
import { PhaseTimelineDrawer } from './hud/PhaseTimelineDrawer';
import { PhaseTimelineTrigger } from './hud/PhaseTimelineTrigger';
import { PowerDetailPanel } from './hud/PowerDetailPanel';
import { PowersPanel } from './hud/PowersPanel';
import { ProvincePopover } from './hud/ProvincePopover';
import { UserMenu } from './hud/UserMenu';
import { ZoomControls } from './hud/ZoomControls';
import { HUDSlot } from './HUDSlot';

type PlayablePower = Exclude<Power, 'neutral' | 'water'>;

export function HUDLayout() {
  const [activePower, setActivePower] = useState<PlayablePower | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [gamePanelExpanded, setGamePanelExpanded] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const lastClickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black">
      <div
        className="relative"
        style={{
          aspectRatio: '2120 / 1427',
          width: 'min(100vw, calc(100vh * 2120 / 1427))',
          height: 'min(100vh, calc(100vw * 1427 / 2120))',
        }}
        onMouseDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          lastClickRef.current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          };
        }}
      >
        <MapCanvas
          selectedProvinceId={selectedProvince?.id ?? null}
          onSelectProvince={(id) =>
            setSelectedProvince({
              id,
              x: lastClickRef.current.x,
              y: lastClickRef.current.y,
            })
          }
        />
        <Themed className="absolute inset-0 pointer-events-none">
          <HUDSlot position="top-right">
            <div className="flex flex-row items-center gap-3">
              <PhaseBadge />
              <AppsDrawer />
              <UserMenu />
            </div>
          </HUDSlot>

          <HUDSlot position="left">
            <GamePanel
              expanded={gamePanelExpanded}
              onToggle={() => setGamePanelExpanded(!gamePanelExpanded)}
            />
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
            <ChatToggle unread={3} onClick={() => setChatOpen(!chatOpen)} />
            <PhaseTimelineTrigger
              open={timelineOpen}
              onClick={() => setTimelineOpen(!timelineOpen)}
            />
          </HUDSlot>

          {selectedProvince && (
            <ProvincePopover
              provinceId={selectedProvince.id}
              x={selectedProvince.x}
              y={selectedProvince.y}
              onClose={() => setSelectedProvince(null)}
            />
          )}

          {chatOpen && (
            <div
              className={`pointer-events-none absolute right-[calc(2.5%+56px)] h-[440px] w-[360px] transition-[bottom] duration-200 ease-out ${
                timelineOpen ? 'bottom-[calc(3.5%+172px)]' : 'bottom-[calc(3.5%+52px)]'
              }`}
            >
              <ChatDrawer onClose={() => setChatOpen(false)} />
            </div>
          )}
        </Themed>
      </div>
    </div>
  );
}
