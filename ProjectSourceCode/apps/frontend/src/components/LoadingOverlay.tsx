import { Loader2 } from 'lucide-react';

import { useMapData } from '../features/map/useMapData';

export function LoadingOverlay() {
  const { isLoading } = useMapData();
  if (!isLoading) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <Loader2 className="spin-forever h-16 w-16 text-white" />
    </div>
  );
}
