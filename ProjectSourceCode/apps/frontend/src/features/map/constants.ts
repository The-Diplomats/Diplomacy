// Deluxe sandwich frame: slightly-darker aged-gold edges | aged gold middle | same darker edges.
// All three bands are gold-family colors (middle just slightly lighter). Middle is thin, not thick.
export const FRAME_EDGE_THICK = 8;
export const FRAME_GOLD_THICK = 19;
export const FRAME_TOTAL = FRAME_EDGE_THICK * 2 + FRAME_GOLD_THICK;
export const FRAME_EDGE_COLOR = '#7a5a38';
export const FRAME_MIDDLE_COLOR = '#b89668';

// Asymmetric horizontal extension: all open sea on the LEFT (Atlantic), godip's right edge
// butts up against the frame (lands run to the painted edge, per spec #9).
export const MAP_EXTENSION_LEFT = 561;
export const MAP_EXTENSION_RIGHT = 35;
export const MAP_EXTENSION_X = MAP_EXTENSION_LEFT + MAP_EXTENSION_RIGHT;
export const MAP_EXTENSION_Y = FRAME_TOTAL;

// Hover highlight extension shapes — when hovering NAt/MAt, the highlight extends into the
// hand-authored left-sea extension area so the ocean reads as one continuous province.
// `fill` closes along the shared x=3 godip-clip edge (invisible seam against the province path).
// `stroke` is open and skips that shared edge so there's no double-line at x=3.
export const HOVER_EXTENSIONS: Record<string, { fill: string; stroke: string }> = {
  nat: {
    fill: 'M 3 3 L 3 709.8 C -40 716 -110 732 -180 745 S -300 758 -523 764 L -523 3 Z',
    stroke: 'M 3 709.8 C -40 716 -110 732 -180 745 S -300 758 -523 764 L -523 3 L 3 3',
  },
  mid: {
    fill: 'M 3 709.8 C -40 716 -110 732 -180 745 S -300 758 -523 764 L -523 1354 L -10 1354 L -10 1352 C -8 1346 -5 1341 -2 1335 C 0 1333 2 1332 3 1331 Z',
    stroke:
      'M 3 709.8 C -40 716 -110 732 -180 745 S -300 758 -523 764 L -523 1354 L -10 1354 L -10 1352 C -8 1346 -5 1341 -2 1335 C 0 1333 2 1332 3 1331',
  },
};

// Zoom + pan tuning.
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;
export const WHEEL_ZOOM_SPEED = 0.0015;
export const KEY_ZOOM_STEP = 1.2;
