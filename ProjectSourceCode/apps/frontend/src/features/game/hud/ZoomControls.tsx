import { Locate, Minus, Plus } from 'lucide-react';

import { Button } from '../../../components/ui/button';

type Props = {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
};

export function ZoomControls({ onZoomIn, onZoomOut, onReset }: Props) {
  return (
    <div className="pointer-events-auto flex flex-col overflow-hidden rounded-full bg-card/95 shadow-lg ring-1 ring-border backdrop-blur-sm">
      <Button variant="ghost" size="icon" onClick={onZoomIn} aria-label="Zoom in">
        <Plus />
      </Button>
      <div className="mx-2 h-px bg-border" />
      <Button variant="ghost" size="icon" onClick={onZoomOut} aria-label="Zoom out">
        <Minus />
      </Button>
      <div className="mx-2 h-px bg-border" />
      <Button variant="ghost" size="icon" onClick={onReset} aria-label="Recenter map">
        <Locate />
      </Button>
    </div>
  );
}
