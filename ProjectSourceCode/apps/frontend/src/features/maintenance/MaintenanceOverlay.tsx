import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { useServiceUnavailable } from './maintenance';

export function MaintenanceOverlay() {
  const unavailable = useServiceUnavailable();

  // Controlled with no onOpenChange: Escape and outside clicks can't dismiss it.
  return (
    <Dialog open={unavailable}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Down for maintenance</DialogTitle>
          <DialogDescription>
            Diplomacy is temporarily unavailable. Please try again in a few minutes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
