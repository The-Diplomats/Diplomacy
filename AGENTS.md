# AGENTS.md — Diplomacy

You are a companion to the Diplomacy team. Your job: help plan, draft code, and explain the codebase. Always follow established patterns before inventing new ones, and read `MilestoneSubmissions/DESIGN_DOC.md` as the source of truth for architecture.

## How to work

- **Patterns first.** Before adding new code, load **every applicable `AGENTS.md`** from the repo root down to your working directory — they're additive, not overriding. Working in `ProjectSourceCode/apps/backend/`? Load this file + `ProjectSourceCode/AGENTS.md` + `apps/backend/AGENTS.md`. Then look at how adjacent code solves the same shape of problem. New code should look like code that's already there.
- **Design doc is architecture; AGENTS.md is procedure.** When they disagree, the design doc wins — flag the discrepancy instead of silently choosing.
- **Industry-standard first, right-sized for this project.** Default to idiomatic patterns for the framework (Express 5, React 19, Drizzle, TanStack Query, etc.). Build for a real working app with reasonable concurrent load — proper indexes, async I/O, sensible caching, request validation, rate limits. Don't over-engineer for scale we won't see: no sharding, no read replicas, no custom load balancers, no chaos testing. If you'd see it in a well-run 10k-user SaaS, it belongs; if you'd only see it at FAANG, it doesn't.
- **Don't be lazy.** No throwaway helpers, no `any`-escape hatches, no "it works for now" comments. If a cleaner path exists in the stack, use it.
- **Ask when ambiguous.** The team owns the decisions. Surface tradeoffs rather than silently picking.
- **Humans own GitHub state.** Don't open, edit, merge, or close PRs. Don't create, edit, close, label, assign, or comment on issues / tickets. Don't request reviews, approve PRs, or push to remote branches without explicit instruction. Your job is to propose code changes and explain tradeoffs; the teammate drives the repo.

## Repo shape

```
.                                   # git repo root (this file)
├── .github/                        # workflows (CI/CD at repo root, not monorepo)
├── MilestoneSubmissions/
│   └── DESIGN_DOC.md               # authoritative architecture doc
├── TeamMeetingLogs/
└── ProjectSourceCode/              # pnpm workspace root
    ├── AGENTS.md                   # monorepo-wide rules
    ├── apps/
    │   ├── backend/AGENTS.md       # backend-specific rules
    │   ├── frontend/AGENTS.md      # frontend-specific rules
    │   └── worker/AGENTS.md        # worker-specific rules
    └── packages/
        ├── db/AGENTS.md            # Drizzle schema + migration flow
        └── contracts/AGENTS.md     # OpenAPI + Kubb + socket event types
```

Load *every* `AGENTS.md` on the path from the repo root to your working directory. They layer — the nested files add rules, they don't replace parent rules.

## Commits + PRs

- **Conventional Commits** are enforced by `commitlint` on PR titles and `commit-msg` hook. Format: `type(scope): subject`. Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `perf`, `style`, `revert`.
- **Don't commit directly to `main`.** `pre-commit` hook blocks it. Branch naming: `<author>/<type>/<issue-or-topic>` (e.g., `rez/feat/78/email-verify`).
- **Breaking OpenAPI changes** require the `breaking-change-approved` label on the PR. `compat-check.yml` runs `oasdiff` and fails without the label.
- **Don't use `--no-verify`.** Pre-commit / pre-push hooks exist on purpose. If one fails, fix the issue; don't bypass.
- **One PR can contain multiple commits.** Preferred when splitting work logically (e.g., CP1 commit, CP2 commit, CP3 commit under one Session A PR). Don't open a PR per commit.

## Releases

Release-please owns versioning + changelog. It opens a Release PR against `main` based on conventional-commit types. Merge the Release PR → tag → deploys to stage/prod. Don't hand-edit versions.

## CI gates

A PR must pass: `commitlint`, `lint`, `test-build`, `contract-check` (when contracts changed), `compat-check` (when API spec changed), `e2e` (Compose stack). Post-merge: `deploy-dev` → `e2e-dev` → `release-please`. Tag → `deploy-stage` → `e2e-stage` → prod approval → `deploy-prod` → `smoke-prod`. Every E2E gate has a `workflow_dispatch` break-glass override requiring a `reason` input. See `DESIGN_DOC.md` §13.

## When you're unsure

- **Architecture**: `MilestoneSubmissions/DESIGN_DOC.md` (890+ lines; grep by section number)
- **Monorepo conventions**: `ProjectSourceCode/AGENTS.md`
- **App patterns**: `ProjectSourceCode/apps/<app>/AGENTS.md`
- **Human**: ask a team member — don't guess on cross-cutting decisions

## What not to do

- **Don't touch GitHub state.** No `gh pr create`, `gh pr edit`, `gh pr merge`, `gh issue create`, `gh issue close`, label edits, or review submissions. Draft the change locally; the teammate opens the PR.
- Don't `git push` without explicit instruction — especially never to `main`, never with `--force`.
- Don't introduce new top-level dependencies without checking the pnpm catalog first (`ProjectSourceCode/pnpm-workspace.yaml`).
- Don't write `TODO` comments without an issue number. Either fix it now, or ask the teammate to file an issue and reference it.
- Don't leave `console.log` in shipped code. Backend uses pino, frontend uses browser devtools.
- Don't bypass the design doc's security conventions (OpenAPI validation on `/api`, rate limits on anonymous endpoints, scrypt for passwords, session regen on auth change). If something seems too strict, raise it in a PR rather than removing it.
