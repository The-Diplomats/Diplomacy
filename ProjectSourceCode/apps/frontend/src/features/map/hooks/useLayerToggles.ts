import { useLocation } from 'react-router';

// Debug layer toggles via URL query params:
//   ?noprovlabels - hide province labels
//   ?nosealabels  - hide sea labels
//   ?nocountries  - hide synthesized country labels
//   ?nolabels     - hide ALL labels (shortcut for all three above)
//   ?nostars      - hide SC stars
//   ?nodecor      - hide decorative foreground borders
//   ?nonoise      - hide paper noise texture
//   ?nowatercolor - disable watercolor filter on provinces
//   ?novignette   - disable coastal vignette
//   ?noimpassable - hide impassable (Switzerland) label
export type LayerToggles = {
  provinceLabels: boolean;
  seaLabels: boolean;
  countryLabels: boolean;
  stars: boolean;
  decorations: boolean;
  noise: boolean;
  watercolor: boolean;
  vignette: boolean;
  impassableLabel: boolean;
};

export function useLayerToggles(): LayerToggles {
  const params = new URLSearchParams(useLocation().search);
  const has = (key: string) => params.has(key) || params.has('nolabels');
  return {
    provinceLabels: !has('noprovlabels'),
    seaLabels: !has('nosealabels'),
    countryLabels: !has('nocountries'),
    stars: !params.has('nostars'),
    decorations: !params.has('nodecor'),
    noise: !params.has('nonoise'),
    watercolor: !params.has('nowatercolor'),
    vignette: !params.has('novignette'),
    impassableLabel: !params.has('noimpassable'),
  };
}
