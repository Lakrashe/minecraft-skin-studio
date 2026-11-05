# Project Rules — Minecraft Skin Studio

This is the **single source of truth for how work is done in this repository**.
It applies equally to human contributors, Claude Code (via `CLAUDE.md`), and
Codex or any other agent (via `AGENTS.md`). Those files only point here and add
tool-specific notes; they must never contradict or duplicate these rules.

If a rule here conflicts with the product specification, the specification wins
for *what* to build and these rules win for *how* to build it. Raise the conflict
instead of silently picking one.

---

## 0. Sources of truth (in priority order)

1. **Product specification** — `docs/SPECIFICATION.md` (the complete Minecraft
   Skin Studio specification). If it is missing, ask for it before building
   features; do not invent product behavior.
2. **This file** — process, architecture, and quality rules.
3. `docs/ARCHITECTURE.md` — module boundaries, the skin document model, data flow.
4. `docs/MINECRAFT_SKIN_FORMAT.md` — texture layout facts. Engine code must match it.
5. `docs/DEVELOPMENT_ROADMAP.md` — what to build next and in what order.
6. `docs/PROJECT_OVERVIEW.md` — product goals and scope (summary of the spec).

When code and docs disagree, treat it as a bug: fix whichever is wrong in the
same change, and say so in the change description.

---

## 1. Architecture rules (non-negotiable)

### 1.1 The skin engine is framework-free
- `src/engine/` (and `src/rig/`, the pose/animation data model) is pure TypeScript. It must **not** import React, React DOM,
  Three.js, the DOM (`document`, `window`, `HTMLCanvasElement`, `ImageData`),
  or any UI/state library.
- The engine works on plain data: `Uint8ClampedArray` RGBA buffers, numbers,
  and the types defined in `src/engine/model/`.
- Everything in the engine must run under Node in Vitest without a browser.
- Browser-only work (PNG decode/encode via canvas, file pickers, clipboard)
  lives in `src/platform/` adapters that convert to/from engine types.

### 1.2 The 2D editor and the 3D renderer are separate
- `src/editor2d/` (Canvas 2D texture editor) and `src/renderer3d/` (3D model
  preview) must **never import from each other**.
- Both depend only on `src/engine/` (and `src/platform/` where needed).
- Both are *views + input* over the same document. Neither owns texture data.
- Painting on the 3D model resolves the hit to a texture coordinate via engine
  UV mapping, then issues the **same engine command** the 2D editor would.

### 1.3 One shared skin document model
- All texture state lives in a single `SkinDocument` (see `docs/ARCHITECTURE.md`).
- No module keeps its own authoritative copy of pixels. Caches (GPU textures,
  canvas bitmaps, thumbnails) are derived, disposable, and rebuilt from the
  document's revision.
- The document shape is versioned. Any change to persisted shape requires a
  version bump and a migration with tests.

### 1.4 Texture data and history stay consistent
- Pixels change **only** through engine commands applied by the document store.
  No direct writes to buffers from UI, editor, or renderer code.
- Every command that changes pixels or document metadata is undoable, and
  records enough data (e.g. a dirty-rect before/after patch) to undo exactly.
- Undo followed by redo must yield a byte-identical texture. This is tested.
- One user gesture (e.g. a full brush stroke) = one history entry.
  Commands may be grouped into a transaction; partial transactions never reach
  history.
- Every applied change increments the document `revision`; views re-render
  based on revision + dirty regions, never on guesses.

### 1.5 Strict TypeScript
- `strict: true`, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride`, `noFallthroughCasesInSwitch`.
- No `any`. Use `unknown` and narrow. No non-null assertions (`!`) without a
  comment explaining why it is safe.
- No `@ts-ignore`. `@ts-expect-error` only in tests, with a reason.
- Validate all external data at the boundary (imported PNGs, saved project
  files, network responses) and convert it into typed engine values.
- Prefer discriminated unions over boolean flags and string-typed enums.

### 1.6 Modular, reusable components
- Small modules with one responsibility. A file over ~300 lines is a signal to split.
- React components are presentational where possible; logic belongs in the
  engine, hooks, or small controllers.
- Export public APIs through each module's `index.ts`. Do not deep-import
  another module's internals.
- No circular dependencies between top-level modules.

### 1.7 Minimal dependencies
- The approved dependency list, with the phase each one becomes allowed, is
  `docs/ARCHITECTURE.md` §Dependencies. Only those packages may be installed,
  and only from their phase onward.
- Anything else needs a written justification in the change description
  (what it does, why it can't be ~50 lines of our own code, bundle size, license,
  maintenance status) and the owner's approval, then a row in that table.
- No UI component kit (MUI, Chakra, shadcn copies, etc.). UI primitives are our
  own in `src/ui/`, styled with Tailwind.
- Zustand holds **app/UI state only** (settings, panels, tool options). It never
  holds the authoritative pixel data — that is the engine `DocumentStore` (§1.3).
- Heavy modules (Three.js, feature pages) are lazy-loaded per route.

### 1.8 Secrets and API keys
- **Never** put API keys, tokens, or secrets in frontend code, in `VITE_*`
  environment variables, in committed files, or in test fixtures.
  Anything bundled into the frontend is public.
- Any feature that needs a secret calls a server-side endpoint (see
  `docs/ARCHITECTURE.md` §Server boundary) which holds the secret.
- The only values allowed in frontend env vars are public by design (e.g. the
  Supabase URL and **anon** key, a Stripe **publishable** key). Service-role keys,
  AI provider keys, and Stripe secret/webhook keys live only in server secrets.
- Database access from the browser is protected by Supabase Row Level Security
  on every table; RLS policies ship with tests.
- `.env*` files with real values are never committed; `.env.example` contains
  names only.
- Agents must not print, log, or paste secret values into chat, commits, or docs.

### 1.9 Tests for Minecraft texture operations
Engine operations that touch the skin texture **must** ship with unit tests.
At minimum:
- UV region tables for every body part, face, and layer (classic and slim).
- Pixel get/set, bounds checks, and alpha handling.
- Legacy 64×32 → 64×64 conversion (including mirrored limbs).
- Classic ↔ slim arm conversion.
- Mirroring/flipping a body part or face.
- Each drawing tool (pencil, eraser, fill, line, etc.) on representative regions.
- Undo/redo round-trips are byte-identical.
- Import/export validation (wrong size, wrong color type, transparency rules).
- Document serialization round-trip and migrations.

Bugs in texture operations get a regression test before the fix.

### 1.10 No fake functionality
From the specification (§27, §28): every visible control must work.
- Never ship a button, menu item, link, or page that does nothing, shows a
  "coming soon" stub, or simulates a result. Features from later phases are
  **absent from the UI** (including navigation) until they are built.
- Never fake data: no invented skins, users, statistics, likes, downloads,
  reviews, or testimonials. Sections that need real data (featured skins,
  trending, statistics, testimonials) appear only once that data exists.
- Never simulate an external service. If a feature needs credentials that are
  missing, it detects that and shows an honest "not configured" state that
  names what is missing; it never pretends to succeed.
- No fake purchases or payment flows, ever (spec §18).
- Content the app ships (templates, outfit presets, palettes) is real, editable
  data created for this project — never Mojang assets, never locked images.

### 1.11 Internationalization and accessibility
- No hard-coded user-facing strings in components. All UI text comes from the
  typed i18n dictionaries (`src/i18n/`); English is the reference, Italian must
  have every key (enforced by the type checker).
- Every interactive element is keyboard-reachable and has an accessible name.
- Respect `prefers-reduced-motion` and the user's animation preference.

---

## 2. Workflow rules

1. **Read before writing.** Before changing a module, read its `index.ts`, the
   relevant doc section, and existing tests.
2. **Small, focused changes.** One concern per change. Don't refactor unrelated
   code in the same change.
3. **Follow the roadmap — one approved phase at a time.** Implement only the
   phase the owner has explicitly requested and approved, working through its
   milestones in `docs/DEVELOPMENT_ROADMAP.md`. Never start the next phase
   without explicit approval. Don't build ahead.
3a. **Preserve existing functionality.** Every change keeps all previously
   working features working. Run the full test suite; add a regression test
   when touching a shipped feature.
4. **Update docs with code.** If you change module boundaries, the document
   model, the skin format handling, or dependencies, update the matching doc in
   the same change.
5. **Definition of done** for any change:
   - `npm run typecheck` passes
   - `npm run lint` passes
   - `npm run test` passes
   - New/changed texture operations have tests
   - Docs updated where affected
6. **Never claim something works without running the checks.** If a check
   could not be run, say so explicitly.
7. **Ask instead of guessing** when the specification is silent or ambiguous
   about user-visible behavior. Record the decision in the relevant doc.

---

## 3. Code conventions

- Language: TypeScript (`.ts` / `.tsx`), ES modules.
- Formatting: Prettier defaults; lint with ESLint. Don't hand-format.
- Naming: `PascalCase` types/components, `camelCase` functions/variables,
  `SCREAMING_SNAKE_CASE` for true constants (e.g. `SKIN_WIDTH`).
  Files: `kebab-case.ts`; React components `PascalCase.tsx`.
- Coordinates: always `(x, y)` in **texture pixels**, origin top-left, unless a
  type name says otherwise (e.g. `ScreenPoint`, `WorldVec3`). Never mix units
  in one function signature without distinct types.
- Colors: engine stores RGBA as 4 bytes per pixel, non-premultiplied.
  `Rgba` type is `{ r, g, b, a }` with 0–255 integers.
- Pure functions by default. Side effects at the edges (store, platform, UI).
- Errors: engine functions return typed results (`Result<T, E>`) for expected
  failures (invalid file, wrong size); throw only for programmer errors.
- Comments explain *why*, not *what*. Cite `docs/MINECRAFT_SKIN_FORMAT.md` when
  encoding a format rule.
- Tests live next to code as `*.test.ts`. Engine tests must not need a DOM.

---

## 4. Git and change hygiene

- Branch per task (`feat/…`, `fix/…`, `docs/…`, `refactor/…`, `test/…`).
- Commit messages: imperative mood, short subject, body explains why.
- Don't commit generated files, build output, or `.env` files.
- Don't commit or push unless the user asks.
- Don't rewrite published history.

---

## 5. What agents must not do

- Implement features not in the specification or outside the approved phase.
- Ship non-functional buttons, stub pages, fake data, or simulated services (§1.10).
- Add dependencies without the justification in §1.7.
- Bypass the document store to mutate pixels.
- Import across the `editor2d` ↔ `renderer3d` boundary, or import React/DOM into the engine.
- Put secrets in frontend code or committed files.
- Disable type checks, lint rules, or tests to make a change pass.
- Distribute Mojang/Microsoft assets (default skins, textures) in the repo
  unless the specification explicitly allows it and licensing is confirmed.
