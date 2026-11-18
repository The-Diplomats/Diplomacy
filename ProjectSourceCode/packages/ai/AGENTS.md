# AGENTS.md — packages/ai

LLM client, schemas, prompt assembly and mock fixtures for AI turns. Read `ProjectSourceCode/AGENTS.md` first. Loading
game state, validating and writing belong to `apps/worker`; `DESIGN_DOC.md` §11 has the flow.

- **Pure.** No database, Redis or queue imports, so prompts and parsing test without the stack.
- **Host-neutral.** Only the `openai` SDK with `LLM_BASE_URL`; no provider SDKs or provider-only request fields.
- **Strict schemas.** Every property in `required` and `additionalProperties: false`, or strict mode is rejected. The
  shape is guaranteed, legality is not: the worker checks orders with `getLegalMoves()`.
- **One fixture per schema name** at `fixtures/llm/<name>.json`, so mock mode and CI can answer it.
- **Prompt assembly** in its own module, never inline in a handler. Wrap player chat in tagged untrusted-content blocks
  (`DESIGN_DOC.md` §15).
- **No logging here.** The worker logs model and token usage.
