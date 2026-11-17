import { useServiceUnavailable } from './maintenance';

export function MaintenanceOverlay() {
  const unavailable = useServiceUnavailable();

  if (!unavailable) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black text-white">
      <div className="text-center">
        <div className="text-lg font-semibold">Down for maintenance</div>
        <div className="text-sm text-white/60">
          Diplomacy is temporarily unavailable. Please try again in a few minutes.
        </div>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
      >
        Try again
      </button>
    </div>
  );
}
