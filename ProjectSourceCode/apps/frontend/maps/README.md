# Map build

This folder holds map source assets and the parser that converts them into the runtime JSON consumed by the frontend.

## Files

- `classical.svg` — source map SVG (vendored from godip, see ATTRIBUTIONS.md)
- `parse-map.ts` — SVG → JSON parser
- `ATTRIBUTIONS.md` — license + source credit

Output is written to `apps/frontend/public/maps/classical.json` and should be committed.
