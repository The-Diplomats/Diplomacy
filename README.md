# Diplomacy Online

Web-based implementation of the 1950s strategy board game Diplomacy. 7-player classic map, in-game chat (public and private DMs), deadline-based asynchronous play, and AI opponents via local Ollama.

Built by **The Diplomats**.

## Team

- Nathaniel Blucher
- Deven Chen
- Brynne Geittmann
- Rez Haleem
- Justin Kurtz

## Architecture

See [MilestoneSubmissions/DESIGN_DOC.md](./MilestoneSubmissions/DESIGN_DOC.md) for the full technical design: stack, API contract, database schema, deployment architecture, security model.

## Repository layout

- `ProjectSourceCode/`: pnpm monorepo with all source code. See its [README](./ProjectSourceCode/README.md) for the development workflow.
- `.github/`: GitHub Actions workflows and PR templates.
- `.githooks/`: shared git hooks (installed on `pnpm install`).

## Deployment

Planned environments:

- Dev: `app.dev.diplomacy.gg` / `api.dev.diplomacy.gg`
- Stage: `app.stage.diplomacy.gg` / `api.stage.diplomacy.gg`
- Prod: `app.diplomacy.gg` / `api.diplomacy.gg`

## License

GPL-3.0-or-later. See [LICENSE](./LICENSE).
