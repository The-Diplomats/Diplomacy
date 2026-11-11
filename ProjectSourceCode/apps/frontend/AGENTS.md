# AGENTS.md — apps/frontend

React 19 + Vite + React Router 7 + TanStack Query + Tailwind v4 + shadcn/ui on Base UI. Read
`ProjectSourceCode/AGENTS.md` for monorepo rules first; this file covers frontend-specific patterns.

## Directory layout

```
src/
├── App.tsx                 # Router + MapBackdrop + global providers
├── main.tsx                # QueryClientProvider, MSW bootstrap
├── api/
│   └── client.ts           # shared fetch wrapper + ApiError (do NOT put endpoints here)
├── features/
│   ├── auth/               # AuthPanel, AuthGate, forms, useSession + mutation hooks, api.ts
│   ├── game/               # GamePanel, hud/, phase displays
│   ├── lobby/              # LobbyPage
│   ├── map/                # MapBackdrop (shared SVG board)
│   └── rules/              # Rules page
├── components/
│   ├── ui/                 # shadcn components (owned, editable)
│   └── Themed.tsx          # app theme wrapper
└── lib/                    # tiny shared utilities
```

**Feature folders own their own `api.ts` + hooks + components + tests.** Shared infrastructure stays in `api/client.ts`,
`components/ui/`, `lib/`.

## shadcn/ui is Base UI, not Radix

shadcn migrated to Base UI in late 2025. Several APIs are different from Radix tutorials:

- **No `asChild` on Triggers.** Don't do `<DropdownMenu.Trigger asChild><Button /></DropdownMenu.Trigger>`. Instead,
  style the Trigger directly or pass children as content.
- **No `onSelect` on Menu Items.** Use `onClick` on the item.
- **Confirm the API with `components/ui/<name>.tsx`** — it's owned code, so what's in the file is what exists.

When in doubt, read `src/components/ui/` for the actual component shape.

## TanStack Query + Kubb

- **Server state goes through TanStack Query** (`useQuery` / `useMutation`). No direct `fetch` in components.
- **The Kubb-generated client** lives at `packages/contracts/src/generated/`. Each endpoint has a `useXxx` hook and a
  plain `xxx()` fn.
- **Feature-local `api.ts`** wraps the Kubb hooks / fns with the shape the feature needs. See `features/auth/api.ts` for
  the pattern.
- **Mutations that establish a session** (login, verify, reset-verify) must call
  `queryClient.setQueryData(sessionQueryKey, user)` on success. See `features/auth/useSession.ts`.
- **Invalidate on realtime events.** On Socket.IO reconnect or `phase:resolved`, call
  `queryClient.invalidateQueries(['game', id])` to refetch authoritative state.

## Auth flow

- **Routes under `/auth/*`** are all handled by `<AuthPanel mode="..." />` — one composer, five modes (login, register,
  register/verify, password-reset, password-reset/verify).
- **Protected routes wrap in `<AuthGate>`** (`features/auth/AuthGate.tsx`). It reads session via `useSession`, renders
  `null` while pending, redirects to `/auth/login?next=<path>` when no session.
- **`?next=` is path-only.** `features/auth/useNextPath.ts` validates — rejects `//evil.com` and absolute URLs. Always
  run `next` through this helper before `navigate()`.
- **Forms are split one-per-file** under `features/auth/`. `LoginForm`, `RegisterForm`, `RegisterVerifyForm`,
  `RegisterResendButton`, `PasswordResetForm`, `PasswordResetVerifyForm`. Don't recombine them.
- **Shared form parts** (`AuthField`, `PasswordInput`, `PasswordStrengthMeter`) live in
  `features/auth/AuthFormParts.tsx`.

## Forms

- **Use the inline event type** `(event: { preventDefault(): void })`, not `React.FormEvent`. React 19 deprecated the
  latter and will emit a warning.
- **Braces on guard clauses** (`return` / `throw`), even on one line. Non-guard single-line `if`s are fine. See
  `ProjectSourceCode/AGENTS.md` for the rule + examples.

## Map backdrop

- **`<MapBackdrop />` is rendered globally** in `App.tsx`, above `<Routes>`. Province hover + selection must work
  through overlays.
- **Overlays set `pointer-events-none`** on their outermost wrapper so clicks fall through to the map. See `AuthPanel`
  for the pattern.
- **Interactive elements inside the overlay** use `pointer-events-auto` locally.
- **Map interaction uses event delegation** — one `onClick` on the SVG root reads
  `event.target.closest('[data-province]')?.dataset.province` and dispatches to the Zustand store.

## Routing

- **React Router v7.** Routes declared in `App.tsx`.
- **Nested routes** are fine; prefer them over flat `/foo-bar` paths when the UI is nested.
- **Navigate programmatically with `useNavigate()` + `onClick`** — **don't** use `<Button asChild>` to wrap a `<Link>`.
  (shadcn-Base-UI constraint: no `asChild` on triggers. Buttons that navigate should take an
  `onClick={() => navigate(...)}` or be wrapped in `<Link>`.)
- **Link as the preferred wrapper for cards and other large clickable regions** — right-click to open in new tab,
  keyboard navigable, focus ring for free. See `features/lobby/LobbyPage.tsx` `GameCard`.

## MSW (dev + tests)

- **MSW handlers at `mocks/handlers/`** mock the OpenAPI endpoints for frontend-only dev + E2E.
- **Enable with `VITE_USE_MSW=true`** (local dev without a real backend).
- **Test fixtures use `ACCEPTED_CODE_PATTERN = /^\d{6}$/`** — any 6-digit code works. Don't hardcode specific codes; it
  makes the mocks brittle.
- **Login mocks gate on `verified`** — return 403 when the user is unverified, mirroring backend behavior.

## Styling

- **Tailwind v4.** Utility-first; avoid inline `style={{...}}` except for computed values (aspect ratios, dynamic
  sizing).
- **CSS variables for theme tokens** come from `index.css`. Don't hardcode colors — use `text-foreground`, `bg-card`,
  etc.
- **`<Themed>` wrapper** applies the app's color + font context. Feature-root components opt into it.

## Comments + naming

- **No single-char names.** Default to full words (`province`, `response`, `event`, `game`).
- **No `*Fab` naming.** Use `*Toggle` for floating corner buttons.
- **No "this file does X" comments.** Component name says it.
- **No em dashes** in code or comments. Colons, periods, or restructure.

## Testing

- **Vitest + Testing Library.** Component tests live next to the component (`*.test.tsx`).
- **Mock the Kubb client via MSW** — don't mock the hook itself. Tests exercise real `useQuery` / `useMutation` through
  the shared `QueryClientProvider`.
- **Real sessions in tests** come from MSW returning 200 with a user payload. Don't fake session state directly in the
  store.

## What not to do

- Don't use `asChild` on shadcn triggers. It doesn't exist on Base UI.
- Don't use `onSelect` on shadcn menu items. Use `onClick`.
- Don't put endpoint wrappers in `src/api/client.ts` — that's infrastructure only (fetch + `ApiError`). Endpoints go in
  `features/<x>/api.ts`.
- Don't write session rows to a store directly — go through the mutation hooks that seed `sessionQueryKey`.
- Don't use `React.FormEvent` — it's deprecated. Use inline event types.
- Don't put components directly under `src/components/` unless they're truly cross-feature. Feature-specific UI goes in
  `features/<x>/`.
- Don't bypass `MapBackdrop`'s `pointer-events-none` convention. Breaking it means province hover stops working behind
  overlays.
