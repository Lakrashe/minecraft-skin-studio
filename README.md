# Minecraft Skin Studio

A web platform for creating Minecraft skins: a professional pixel editor with
accurate UV mapping and a synchronized real-time 3D preview at its core, plus
templates, outfits, poses, cinematic renders, AI generation, a community
gallery, and an optional marketplace.

> **Status:** Phase 1 in progress. The technical foundation is in place (app
> shell, design system, settings, EN/IT, tests, CI); the skin editor itself is
> not built yet. See [`docs/DEVELOPMENT_ROADMAP.md`](docs/DEVELOPMENT_ROADMAP.md).

## Documentation

| Document | Purpose |
|---|---|
| [`PROJECT_RULES.md`](PROJECT_RULES.md) | Binding rules for architecture, code quality, testing, and workflow. Shared by humans and AI agents. |
| [`AGENTS.md`](AGENTS.md) | Entry point for Codex and other agents; points to the shared rules. |
| [`CLAUDE.md`](CLAUDE.md) | Entry point for Claude Code; imports the shared rules. |
| [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md) | The complete product specification — source of truth for features. |
| [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) | Product goals, users, scope, and non-goals. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Modules, boundaries, the skin document model, history, and data flow. |
| [`docs/MINECRAFT_SKIN_FORMAT.md`](docs/MINECRAFT_SKIN_FORMAT.md) | Skin texture layout, UV regions, classic/slim, legacy format. |
| [`docs/DEVELOPMENT_ROADMAP.md`](docs/DEVELOPMENT_ROADMAP.md) | Milestones in build order with acceptance criteria. |

## Tech stack

- TypeScript (strict), React 19, Vite 8, React Router, Tailwind CSS 4, Zustand
- Framework-free skin engine (pure TypeScript) shared by all features
- HTML Canvas 2D for the pixel editor
- Three.js + React Three Fiber + Drei for 3D (lazy-loaded)
- Vitest + Testing Library for unit/component tests, Playwright for e2e
- Later phases: Supabase (auth, database, storage, Edge Functions for AI),
  Stripe for the marketplace

Dependencies are approved per phase; see `docs/ARCHITECTURE.md` §13.

## Getting started

Requires Node.js 22.22.2+ (22.x), 24.15+ (24.x) or 26+. Other versions are refused at install
(`engine-strict`), because the locked tools don't support them.

```bash
npm install
npm run dev
```

Then open http://localhost:5173. In development, `/dev/ui` shows the design
system components and a 3D smoke test.

Checks every change must pass:

```bash
npm run check
```

End-to-end tests (first run: `npx playwright install chromium`):

```bash
npm run test:e2e
```

Production build:

```bash
npm run build
npm run preview
```

## Working with AI agents

Claude Code and Codex follow the same rules in `PROJECT_RULES.md`.
`CLAUDE.md` and `AGENTS.md` are thin entry points — add new rules to
`PROJECT_RULES.md`, not to the agent files.

## Legal

Minecraft is a trademark of Mojang Synergies AB / Microsoft. This project is not
affiliated with or endorsed by Mojang or Microsoft. Do not commit Mojang assets
(including default skins) to this repository.
