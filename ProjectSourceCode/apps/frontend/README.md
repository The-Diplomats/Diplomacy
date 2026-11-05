# frontend

Vite + React 19 + TypeScript SPA for Diplomacy.

## Local setup

```sh
cp .env.example .env
pnpm --filter frontend dev
```

Dev server runs at http://localhost:5173. `/api` and `/socket.io` are proxied to the backend at `http://localhost:3001`
(see `vite.config.ts`). `/` redirects to `/game/test`.

## Scripts

- `pnpm --filter frontend dev`: Vite dev server with HMR
- `pnpm --filter frontend build`: typecheck + production build to `dist/`
- `pnpm --filter frontend typecheck`: `tsc -b --noEmit`
- `pnpm --filter frontend test`: Vitest in browser mode (real Chromium via Playwright)
- `pnpm --filter frontend test:watch`: Vitest watch mode
- `pnpm --filter frontend preview`: serve the built bundle
- `pnpm --filter frontend maps:build`: re-parse `maps/classical.svg` into `public/maps/classical.json`

## Env vars

- `VITE_API_URL` (default `/api`): base URL for backend HTTP calls. Cloud builds point this at the env's api subdomain.
- `VITE_WS_URL` (default `/`): base URL for the Socket.IO handshake. Cloud uses `wss://api.*`.
- `VITE_USE_MSW` (default unset): when `true`, starts the MSW service worker in the browser and intercepts `/api/*` with
  the handlers in `mocks/`.

## Routes

- `/` → redirects to `/game/test`
- `/login`, `/register`: auth cards centered over the map backdrop
- `/lobby`: list of mock games
- `/game/:id`: in-game HUD over the interactive Diplomacy map
- `*` → `LobbyPage`

## Mocks

MSW handlers live at `apps/frontend/mocks/`:

- `handlers/*.ts`: one request handler (or group) per file
- `handlers/index.ts`: `getDefaultHandlers()` composes them
- `browser.ts`: `setupWorker` consumed by `main.tsx` when `VITE_USE_MSW=true`
- `node.ts`: `setupServer` for headless use

The service worker script lives at `public/mockServiceWorker.js` and is kept in sync by MSW's postinstall hook
(`"msw": { "workerDirectory": ["public"] }` in `package.json`). Teammates don't need to run `msw init`.

## Testing

Tests run in a real Chromium instance via Vitest browser mode + Playwright. Config: `vitest.config.ts`.

- Test files: `src/**/*.test.{ts,tsx}` and `mocks/**/*.test.{ts,tsx}`
- Playwright binary install (once per machine): `pnpm --filter frontend exec playwright install chromium`
- `VITE_USE_MSW` is irrelevant for tests — tests that need request mocks import `worker` from `mocks/browser.ts` and
  call `worker.start()` / `worker.resetHandlers()` in their setup. `mocks/node.ts` is for anything that actually runs in
  Node (e.g. a future headless harness) and isn't used by the browser suite.

## Feature layout

```
src/
├─ components/            Shared primitives (Themed, LoadingOverlay) + shadcn ui/
├─ features/
│  ├─ auth/               LoginPage, RegisterPage
│  ├─ lobby/              LobbyPage (GameCard + EmptyState)
│  ├─ map/                MapBackdrop, MapCanvas, hooks, layers
│  └─ game/               HUDLayout + hud/* (PowersPanel, ChatDrawer, PhaseTimelineDrawer, ...)
├─ assets/                Vendored flag + unit SVGs (via vite-plugin-svgr)
├─ App.tsx                Providers (ThemeProvider, QueryClientProvider) + Routes
└─ main.tsx               Entry; conditionally boots MSW before mount
maps/                    godip `classical.svg` + parse script
mocks/                   MSW handlers (see Mocks section)
public/                  Static assets + mockServiceWorker.js + /maps/classical.json
```

## Stack

- Vite 5, React 19, TypeScript (strict), Tailwind v4
- shadcn/ui components (Base UI based, not Radix — note `onClick` instead of `onSelect`, no `asChild` on triggers)
- next-themes (scoped to the `.dark` class via a `<Themed>` wrapper so the SVG map stays outside the cascade)
- `@tanstack/react-query` for server state, including the map data fetch in `useMapData`
- `@shadcn/react` for the `MessageScroller` primitive (chat drawer)
- `msw` for request mocking, `@vitest/browser` + `@vitest/browser-playwright` for in-browser tests
