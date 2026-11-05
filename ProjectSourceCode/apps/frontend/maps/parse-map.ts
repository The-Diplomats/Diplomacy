import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'classical.svg');
const OUTPUT = resolve(__dirname, '../public/maps/classical.json');

const PROVINCE_ID_RE = /^[a-z]{3}(?:\/[a-z]{2})?$/;
const SC_ID_SUFFIX_RE = /Center$/;

type ProvinceData = { id: string; d: string };
type ImpassableData = { d: string };
type DecorativeRegionData = { id: string; d: string };
type SupplyCenterData = { id: string; x: number; y: number };
type BorderData = { d: string; kind: 'path' | 'polyline' | 'polygon' };
type LabelData = {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  italic?: boolean;
  bold?: boolean;
  letterSpacing?: number;
  rotation?: number;
};
type NoisePattern = { href: string; opacity: number };
type MapData = {
  width: number;
  height: number;
  provinces: ProvinceData[];
  impassables: ImpassableData[];
  decorativeRegions: DecorativeRegionData[];
  supplyCenters: SupplyCenterData[];
  borders: BorderData[];
  labels: LabelData[];
  noise?: NoisePattern;
  coastShadow?: string;
};

// Non-province landmasses godip draws decoratively in the foreground layer.
// All shapes filled with the impassableStripes pattern are decorative landmasses
// (Ireland, Iceland, Cyprus, Switzerland alt, Corsica, Sardinia, Gotland, etc.).
// Only a few have meaningful ids; the rest are Path-X, Path-X-Y, use168.

function polygonPointsToPathD(points: string): string {
  const coords = points.trim().split(/\s+/);
  if (coords.length === 0) {
    return '';
  }
  return 'M' + coords.join(' L') + ' Z';
}

function extractPathD(element: Element): string | null {
  const tag = element.tagName.toLowerCase();
  if (tag === 'path') {
    return element.getAttribute('d');
  }
  if (tag === 'polygon') {
    const points = element.getAttribute('points');
    return points ? polygonPointsToPathD(points) : null;
  }
  const shape = element.querySelector('path, polygon');
  return shape ? extractPathD(shape) : null;
}

function firstPointOf(pathD: string): { x: number; y: number } {
  const match = pathD.match(/^[Mm]\s*([-\d.]+)[,\s]+([-\d.]+)/);
  return match
    ? { x: parseFloat(match[1] ?? '0'), y: parseFloat(match[2] ?? '0') }
    : { x: 0, y: 0 };
}

function parseProvinces(layer: Element): ProvinceData[] {
  const result: ProvinceData[] = [];
  for (const element of layer.querySelectorAll('[id]')) {
    const id = element.getAttribute('id');
    if (!id || !PROVINCE_ID_RE.test(id)) {
      continue;
    }
    const d = extractPathD(element);
    if (!d) {
      continue;
    }
    result.push({ id, d });
  }
  return result;
}

function parseImpassables(layer: Element): ImpassableData[] {
  // Background layer holds: the base rect, Switzerland (`path838`), and a
  // Gaussian-blurred decorative shadow path. Skip the shadow (uses filter848)
  // and the base rect; keep only solid-fill impassable shapes.
  const result: ImpassableData[] = [];
  for (const path of layer.querySelectorAll('path')) {
    const style = path.getAttribute('style') ?? '';
    if (style.includes('filter:url(#filter848)') || style.includes('fill:none')) {
      continue;
    }
    const d = path.getAttribute('d');
    if (d) {
      result.push({ d });
    }
  }
  return result;
}

function parseCoastShadow(layer: Element): string | undefined {
  // godip ships a single pre-computed coast outline (id="Shape") in the background
  // layer, stroked + Gaussian-blurred to create coastal vignetting. Diplicity uses
  // this directly; we render it the same way.
  for (const path of layer.querySelectorAll('path')) {
    const style = path.getAttribute('style') ?? '';
    if (style.includes('filter:url(#filter848)')) {
      return path.getAttribute('d') ?? undefined;
    }
  }
  return undefined;
}

function parseSupplyCenters(layer: Element): SupplyCenterData[] {
  // supply-centers layer holds 34 paths with ids like `sevCenter`, `conCenter`.
  // The path's first M point is the SC position; the id suffix is the province.
  const result: SupplyCenterData[] = [];
  for (const path of layer.querySelectorAll('path[id]')) {
    const rawId = path.getAttribute('id') ?? '';
    const id = rawId.replace(SC_ID_SUFFIX_RE, '');
    const d = path.getAttribute('d');
    if (!d) {
      continue;
    }
    const { x, y } = firstPointOf(d);
    result.push({ id, x, y });
  }
  return result;
}

function parseDecorativeRegions(layer: Element): DecorativeRegionData[] {
  // Foreground decorative landmasses. godip paints them with either:
  //   - `impassableStripes` pattern (Ireland, Iceland, Cyprus, Swiss, Corsica, Sardinia, Gotland),
  //   - OR a solid `#f4d7b5` warm peach fill (Isle of Man, pairs of the above).
  // Many lack meaningful ids. We capture both styles.
  const result: DecorativeRegionData[] = [];
  for (const elem of layer.querySelectorAll('path, polygon')) {
    const style = elem.getAttribute('style') ?? '';
    const isDecor = style.includes('impassableStripes') || style.includes('#f4d7b5');
    if (!isDecor) {
      continue;
    }
    const id = elem.getAttribute('id') ?? '';
    const d = extractPathD(elem);
    if (d) {
      result.push({ id, d });
    }
  }
  return result;
}

function parseBorders(layer: Element): BorderData[] {
  // foreground layer: ~90 stroked outlines (fill:none, stroke:#000000). These
  // are the sharp dark borders Deluxe uses between provinces.
  const result: BorderData[] = [];
  for (const path of layer.querySelectorAll('path')) {
    const d = path.getAttribute('d');
    if (d) {
      result.push({ d, kind: 'path' });
    }
  }
  for (const polyline of layer.querySelectorAll('polyline')) {
    const points = polyline.getAttribute('points');
    if (points) {
      result.push({ d: 'M' + points.trim().split(/\s+/).join(' L'), kind: 'polyline' });
    }
  }
  for (const polygon of layer.querySelectorAll('polygon')) {
    const points = polygon.getAttribute('points');
    if (points) {
      result.push({ d: polygonPointsToPathD(points), kind: 'polygon' });
    }
  }
  return result;
}

function parseLabels(layer: Element): LabelData[] {
  const result: LabelData[] = [];
  for (const text of layer.querySelectorAll('text')) {
    const content = text.textContent?.trim() ?? '';
    if (!content) {
      continue;
    }
    // Inkscape puts the real position on the tspan; text's x/y is an offset.
    const tspan = text.querySelector('tspan');
    const x = parseFloat(tspan?.getAttribute('x') ?? text.getAttribute('x') ?? '0');
    const y = parseFloat(tspan?.getAttribute('y') ?? text.getAttribute('y') ?? '0');

    const transform = text.getAttribute('transform') ?? '';
    const rotateMatch = transform.match(/rotate\(([-\d.]+)\)/);
    const rotation = rotateMatch?.[1] ? parseFloat(rotateMatch[1]) : undefined;

    const style = text.getAttribute('style') ?? '';
    const fontSize = parseInt(style.match(/font-size:(\d+)/)?.[1] ?? '16', 10);
    const italic = /font-style:italic/.test(style);
    const bold = /font-weight:bold|font-weight:700/.test(style);
    const letterSpacingMatch = style.match(/letter-spacing:(-?[\d.]+)/);
    const letterSpacing = letterSpacingMatch?.[1] ? parseFloat(letterSpacingMatch[1]) : undefined;
    result.push({ text: content, x, y, fontSize, italic, bold, letterSpacing, rotation });
  }
  return result;
}

function parseNoise(doc: Document): NoisePattern | undefined {
  // noise layer: one rect fill=url(#pattern1827) → pattern-4-3 → base64 PNG image.
  const noiseLayer = doc.querySelector('g[id="layer1"]');
  if (!noiseLayer) {
    return undefined;
  }
  const rect = noiseLayer.querySelector('rect');
  if (!rect) {
    return undefined;
  }
  const style = rect.getAttribute('style') ?? '';
  const opacityMatch = style.match(/fill-opacity:([\d.]+)/);
  const opacity = opacityMatch?.[1] ? parseFloat(opacityMatch[1]) : 0.05;
  const fillMatch = style.match(/fill:url\(#([^)]+)\)/);
  if (!fillMatch?.[1]) {
    return undefined;
  }
  // Walk the pattern chain to find the <image href="data:...">
  let patternId: string | undefined = fillMatch[1];
  for (let hop = 0; hop < 5 && patternId; hop++) {
    const pattern: Element | null = doc.querySelector(`pattern[id="${patternId}"]`);
    if (!pattern) {
      return undefined;
    }
    const image = pattern.querySelector('image');
    if (image) {
      const href = image.getAttribute('href') ?? image.getAttribute('xlink:href');
      if (href) {
        return { href, opacity };
      }
    }
    const nextRef: string | null =
      pattern.getAttribute('href') ?? pattern.getAttribute('xlink:href');
    patternId = nextRef ? nextRef.replace(/^#/, '') : undefined;
  }
  return undefined;
}

function parseMap(): MapData {
  const svg = readFileSync(SOURCE, 'utf8');
  const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
  const doc = dom.window.document;

  const svgEl = doc.querySelector('svg');
  if (!svgEl) {
    throw new Error('No <svg> root in classical.svg');
  }

  const [, , widthStr, heightStr] = (svgEl.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/);
  const width = Number(widthStr);
  const height = Number(heightStr);

  const provincesLayer = doc.querySelector('g[id="provinces"]');
  const backgroundLayer = doc.querySelector('g[id="background"]');
  const supplyCentersLayer = doc.querySelector('g[id="supply-centers"]');
  const foregroundLayer = doc.querySelector('g[id="foreground"]');
  const namesLayer = doc.querySelector('g[id="names"]');

  return {
    width,
    height,
    provinces: provincesLayer ? parseProvinces(provincesLayer) : [],
    impassables: backgroundLayer ? parseImpassables(backgroundLayer) : [],
    decorativeRegions: foregroundLayer ? parseDecorativeRegions(foregroundLayer) : [],
    supplyCenters: supplyCentersLayer ? parseSupplyCenters(supplyCentersLayer) : [],
    borders: foregroundLayer ? parseBorders(foregroundLayer) : [],
    labels: namesLayer ? parseLabels(namesLayer) : [],
    noise: parseNoise(doc),
    coastShadow: backgroundLayer ? parseCoastShadow(backgroundLayer) : undefined,
  };
}

const data = parseMap();
console.log(
  `Parsed ${data.provinces.length} provinces, ${data.impassables.length} impassables, ${data.decorativeRegions.length} decorative regions, ${data.supplyCenters.length} SCs, ${data.borders.length} borders, ${data.labels.length} labels, noise=${data.noise ? 'yes' : 'no'}`,
);

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify(data, null, 2) + '\n');
console.log(`Wrote ${OUTPUT}`);
