import { useMapData } from './useMapData.ts';

export function MapCanvas() {
  const { data } = useMapData();

  if (!data) {
    return null;
  }

  return (
    <svg
      viewBox={`0 0 ${data.width} ${data.height}`}
      preserveAspectRatio="xMidYMid meet"
      className="fixed inset-0 z-[5] h-full w-full"
    >
      {data.provinces.map((province) => (
        <path
          key={province.id}
          id={province.id}
          data-province={province.id}
          d={province.d}
          className="fill-stone-200 stroke-stone-500 stroke-[0.5] hover:fill-stone-300 cursor-pointer"
        />
      ))}
    </svg>
  );
}
