# Map data attribution

The province graph and starting position in `src/map.ts` (`CLASSIC_PROVINCES`, `ARMY_ADJACENCY`, `FLEET_ADJACENCY`,
`STARTING_UNITS`) are transcribed from the [zond/godip](https://github.com/zond/godip) repository's
`variants/classical/start/` (`map.go`, `units.go`). godip's mixed land/sea/coast edges are split into separate army and
fleet adjacency; province names are added.

- License: GPL-3.0-or-later
- Attribution: godip contributors (https://github.com/zond/godip/graphs/contributors)

Our project ships under the same license.
