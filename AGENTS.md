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

> These become valid once the project is scaffolded (Roadmap milestone 1.1).

```bash
npm install          # install dependencies
npm run dev          # start the Vite dev server
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # vitest run
npm run build        # production build
```

Run `typecheck`, `lint`, and `test` before reporting a task as done. If you could
not run them, say so.

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
