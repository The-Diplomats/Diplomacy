# Map asset attribution

`classical.json` is derived at build time from `apps/frontend/maps/classical.svg`, which is vendored unchanged from the
[zond/godip](https://github.com/zond/godip) repository's `variants/classical/svg/map.svg`.

- License: GPL-3.0-or-later
- Attribution: godip contributors (https://github.com/zond/godip/graphs/contributors)

Our project ships under the same license.

To regenerate `classical.json` after updating the source SVG:

```sh
pnpm --filter frontend maps:build
```
