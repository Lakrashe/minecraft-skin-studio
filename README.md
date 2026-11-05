# Minecraft Skin Studio

A web platform for creating Minecraft skins: a professional pixel editor with
accurate UV mapping and a synchronized real-time 3D preview at its core, plus
templates, outfits, poses, cinematic renders, AI generation, a community
gallery, and an optional marketplace.

> **Status:** pre-implementation. This repository contains the specification,
> architecture, and development rules only. Phase 1 starts after owner approval.
> See [`docs/DEVELOPMENT_ROADMAP.md`](docs/DEVELOPMENT_ROADMAP.md).

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

## Planned tech stack

- TypeScript (strict), React, Vite, React Router, Tailwind CSS, Zustand
- Framework-free skin engine (pure TypeScript) shared by all features
- HTML Canvas 2D for the pixel editor
- Three.js + React Three Fiber + Drei for 3D
- Vitest for tests
- Later phases: Supabase (auth, database, storage, Edge Functions for AI),
  Stripe for the marketplace

Dependencies are approved per phase; see `docs/ARCHITECTURE.md` §13.

## Getting started

Available after roadmap milestone 1.1 (project scaffold):

```bash
npm install
npm run dev
```

Checks every change must pass:

```bash
npm run typecheck
npm run lint
npm run test
```

## Working with AI agents

Claude Code and Codex follow the same rules in `PROJECT_RULES.md`.
`CLAUDE.md` and `AGENTS.md` are thin entry points — add new rules to
`PROJECT_RULES.md`, not to the agent files.

## Legal

Minecraft is a trademark of Mojang Synergies AB / Microsoft. This project is not
affiliated with or endorsed by Mojang or Microsoft. Do not commit Mojang assets
(including default skins) to this repository.
