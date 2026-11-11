See [AGENTS.md](./AGENTS.md).

Nested rules:

- `ProjectSourceCode/AGENTS.md` — monorepo-wide
- `ProjectSourceCode/apps/backend/AGENTS.md` — backend-specific
- `ProjectSourceCode/apps/frontend/AGENTS.md` — frontend-specific
- `ProjectSourceCode/apps/worker/AGENTS.md` — worker-specific
- `ProjectSourceCode/packages/db/AGENTS.md` — Drizzle schema + migrations
- `ProjectSourceCode/packages/contracts/AGENTS.md` — OpenAPI + Kubb + socket event types

Load *every* `AGENTS.md` on the path from the repo root to your working directory — they layer additively, not overridingly. Working in `ProjectSourceCode/apps/backend/`? Load `AGENTS.md` + `ProjectSourceCode/AGENTS.md` + `ProjectSourceCode/apps/backend/AGENTS.md`.

Authoritative architecture: `MilestoneSubmissions/DESIGN_DOC.md`.
