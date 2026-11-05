# CLAUDE.md

Instructions for Claude Code. Codex and other agents read `AGENTS.md`; both
files defer to the same shared rules, so the agents behave the same way.

## Shared rules (binding)

@PROJECT_RULES.md

## Agent instructions shared with Codex

@AGENTS.md

## Reference docs — read the relevant one before changing that area

- Product specification (source of truth for features): `docs/SPECIFICATION.md`
- Product scope and goals: `docs/PROJECT_OVERVIEW.md`
- Module boundaries, document model, history, data flow: `docs/ARCHITECTURE.md`
- Texture layout and UV regions: `docs/MINECRAFT_SKIN_FORMAT.md`
- Milestones and current focus: `docs/DEVELOPMENT_ROADMAP.md`

## Claude Code-specific notes

- Keep this file thin. Rules belong in `PROJECT_RULES.md` so Codex sees them too.
  If you learn a new project rule, add it there, not here.
- Use the task list to show the plan for multi-step work, and run
  `npm run typecheck`, `npm run lint`, and `npm run test` before wrapping up.
- Personal or machine-specific preferences go in `CLAUDE.local.md` (git-ignored),
  never in this file.
