# AGENTS.md

Instructions for AI coding agents (Codex and any agent that reads `AGENTS.md`).
Claude Code reads `CLAUDE.md`, which points to the same rules.

## Required reading before any change

1. **`PROJECT_RULES.md`** — the shared rules. They are binding. Read the whole file.
2. `docs/SPECIFICATION.md` — the product specification (source of truth for features).
3. The doc for the area you are touching:
   - Engine, document model, history, module boundaries → `docs/ARCHITECTURE.md`
   - Texture layout, UV regions, skin variants → `docs/MINECRAFT_SKIN_FORMAT.md`
   - What to work on next → `docs/DEVELOPMENT_ROADMAP.md`
   - Product scope → `docs/PROJECT_OVERVIEW.md`

This file intentionally does **not** restate the rules. If anything here seems to
conflict with `PROJECT_RULES.md`, `PROJECT_RULES.md` wins.

## Quick reference (summary only — see PROJECT_RULES.md for the full rules)

- `src/engine/` is pure TypeScript: no React, no DOM, no Three.js.
- `src/editor2d/` and `src/renderer3d/` never import each other.
- Pixels change only through engine commands applied by the document store;
  every change is undoable and undo/redo is byte-identical.
- Strict TypeScript; no `any`, no `@ts-ignore`.
- No new dependencies without written justification.
- No secrets in frontend code, `VITE_*` vars, or committed files.
- Texture operations need unit tests.
- Implement only the phase the owner has approved; never start the next one unasked.
- No fake functionality: no dead buttons, stub pages, fake data, or simulated
  services. Unbuilt features are absent from the UI.
- All UI text goes through the typed EN/IT i18n dictionaries.

## Commands

Requires Node.js `^22.22.2 || ^24.15.0 || >=26` (enforced by `.npmrc` `engine-strict`;
CI tests 22.22.2, 24 and 26).

```bash
npm install          # install dependencies
npm run dev          # start the Vite dev server (http://localhost:5173)
npm run check        # typecheck + lint + format check + unit tests
npm run typecheck    # tsc -b --noEmit (app, DOM-free engine/rig, tooling, e2e)
npm run lint         # eslint (includes module-boundary rules)
npm run format       # prettier --write (code only; Markdown is hand-formatted)
npm run test         # vitest run (node, jsdom and lint-boundary projects)
npm run test:e2e     # playwright: builds, serves, tests desktop + mobile
npm run build        # production build
```

First-time e2e setup: `npx playwright install chromium`.

Run `npm run check` before reporting a task as done, and `npm run test:e2e` when
you changed UI, routing or the build. If you could not run them, say so.

Dev-only tooling: `/dev/ui` (dev server only) shows every design-system
component and a 3D smoke test. Use existing primitives from `src/ui` before
writing new ones.

## Working style

- Make small, focused changes on the current roadmap milestone.
- Update the relevant doc in the same change when you alter architecture,
  the document model, format handling, or dependencies.
- When the specification is silent on user-visible behavior, ask rather than guess.

## Codex-specific notes

- Codex does not follow file imports in `AGENTS.md`; open `PROJECT_RULES.md`
  and the relevant `docs/` files explicitly at the start of each task.
- Nested `AGENTS.md` files may be added in subdirectories later; they may only add
  local detail, never override `PROJECT_RULES.md`.
