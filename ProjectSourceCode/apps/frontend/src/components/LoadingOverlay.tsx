import { Loader2 } from 'lucide-react';

import { useMapData } from '../features/map/useMapData';

export function LoadingOverlay() {
  const { isLoading, isError, refetch } = useMapData();

  if (isError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black text-white">
        <div className="text-center">
          <div className="text-lg font-semibold">Couldn't load the map</div>
          <div className="text-sm text-white/60">Check your connection and try again.</div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <Loader2 className="spin-forever h-16 w-16 text-white" />
    </div>
  );
}
