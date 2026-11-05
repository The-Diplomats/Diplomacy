// Graticule — faint latitude/longitude grid lines for the map backdrop.
//
// Uses a sinusoidal projection anchored to godip's viewBox. godip's classical map covers roughly
// Europe (lat 30–70°, lon −25°–45°), 1524×1357 units. The sinusoidal formula gives perfectly
// horizontal latitude lines (easy to read) and naturally curving longitude lines (meridians
// converge toward the pole), which matches the globe feel on the Deluxe board.
//
// We also add a very mild artificial bow to latitude lines so the whole grid reads as spherical
// rather than flat — tunable via LAT_BOW. Set to 0 for pure sinusoidal.

// Orthographic projection — the map represents a hemisphere viewed from outside the sphere.
// This is what you see on a real globe from any angle, and gives the circular Deluxe-board look.
// GLOBE_RADIUS sets how large the sphere is in viewBox units; bigger = flatter curves (closer
// to equirectangular), smaller = more dramatic globe curvature.
const CENTER = { x: 762, y: 678, lat: 50, lon: 10 };
const GLOBE_RADIUS = 1800;

export const GRATICULE_LAT_STEP = 10;
export const GRATICULE_LON_STEP = 20;
export const GRATICULE_SAMPLE_STEP = 2;

function project(lat: number, lon: number): { x: number; y: number } {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = ((lon - CENTER.lon) * Math.PI) / 180;
  const lat0Rad = (CENTER.lat * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  const sinLat = Math.sin(latRad);
  const cosLat0 = Math.cos(lat0Rad);
  const sinLat0 = Math.sin(lat0Rad);
  const cosLon = Math.cos(lonRad);
  const sinLon = Math.sin(lonRad);
  // Standard orthographic azimuthal projection centered at (CENTER.lat, CENTER.lon).
  const x = GLOBE_RADIUS * cosLat * sinLon;
  const y = -GLOBE_RADIUS * (cosLat0 * sinLat - sinLat0 * cosLat * cosLon);
  return { x: CENTER.x + x, y: CENTER.y + y };
}

function polylinePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) {
    return '';
  }
  const parts = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  return `M ${parts[0]} L ${parts.slice(1).join(' L ')}`;
}

function latitudeLine(lat: number, lonStart: number, lonEnd: number): string {
  const points: Array<{ x: number; y: number }> = [];
  for (let lon = lonStart; lon <= lonEnd; lon += GRATICULE_SAMPLE_STEP) {
    points.push(project(lat, lon));
  }
  return polylinePath(points);
}

function longitudeLine(lon: number, latStart: number, latEnd: number): string {
  const points: Array<{ x: number; y: number }> = [];
  for (let lat = latStart; lat <= latEnd; lat += GRATICULE_SAMPLE_STEP) {
    points.push(project(lat, lon));
  }
  return polylinePath(points);
}

// Generate once at module load. Latitude lines use a very wide lon range so they span the full
// visible width even at high latitudes (where the cos-lat factor compresses the x axis).
// Longitude lines use a moderate step for a readable spacing.
export const GRATICULE_LATITUDES: string[] = [];
for (let lat = 10; lat <= 85; lat += GRATICULE_LAT_STEP) {
  GRATICULE_LATITUDES.push(latitudeLine(lat, -80, 90));
}

export const GRATICULE_LONGITUDES: string[] = [];
for (let lon = -60; lon <= 80; lon += GRATICULE_LON_STEP) {
  GRATICULE_LONGITUDES.push(longitudeLine(lon, 10, 85));
}
