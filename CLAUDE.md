See [AGENTS.md](./AGENTS.md).

Nested rules:

- `ProjectSourceCode/AGENTS.md` — monorepo-wide
- `ProjectSourceCode/apps/backend/AGENTS.md` — backend-specific
- `ProjectSourceCode/apps/frontend/AGENTS.md` — frontend-specific
- `ProjectSourceCode/apps/worker/AGENTS.md` — worker-specific
- `ProjectSourceCode/packages/db/AGENTS.md` — Drizzle schema + migrations
- `ProjectSourceCode/packages/contracts/AGENTS.md` — OpenAPI + Kubb + socket event types

For each file you're changing, load *every* `AGENTS.md` on the path from the repo root to that file's directory — not your current working directory, the file's. They layer additively, not overridingly. Editing a file under `ProjectSourceCode/apps/backend/`? Load `AGENTS.md` + `ProjectSourceCode/AGENTS.md` + `ProjectSourceCode/apps/backend/AGENTS.md`, even if your shell is at the repo root.

Authoritative architecture: `MilestoneSubmissions/DESIGN_DOC.md`.
