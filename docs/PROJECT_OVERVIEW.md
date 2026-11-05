# Project Overview

> Summary of `docs/SPECIFICATION.md`, which is the source of truth. If this file
> and the specification disagree, the specification wins — update this file.

## What it is

Minecraft Skin Studio is a web platform for creating Minecraft player skins:
a professional pixel editor with accurate UV mapping and a synchronized
real-time 3D preview at its core, surrounded by creative tools (templates,
random generator, outfits, poses, cinematic renders), AI generation, a
community gallery, and an optional marketplace.

**Non-negotiable core (spec §29):** the 2D pixel editor, accurate Minecraft UV
mapping, and the synchronized real-time 3D preview.

## Principles

1. **Real, working features only.** Every button works; nothing is simulated;
   unbuilt features are absent, not stubbed (PROJECT_RULES §1.10).
2. **Valid output always.** Anything the studio produces — drawn, templated,
   randomized, AI-generated, or converted from an image — is a correctly mapped,
   editable 64×64 skin.
3. **Free editor without an account.** Accounts only for cloud saving,
   publishing, following, and community interactions (spec §19).
4. **No lost work.** Autosave, undo/redo, version history, safe restore.
5. **Professional feel.** Creative-software layout, dark by default, responsive.

## Target users

- Players creating or customizing their own skin (often young — see risks).
- Pixel artists who need precise control and a live 3D view.
- Creators who publish, share, and (optionally) sell skins and packs.

## Feature map by phase

| Phase | Features (spec section) |
|---|---|
| **1 — Core product** | Branding & design system (§1), landing page (§2, without community data sections), 2D editor with all tools (§3), body-part editing (§4), inner/outer skin layers (§5), 3D viewer with controls, lighting, animations, screenshots (§6), import/export PNG (§16), undo/redo, local projects + autosave (§15 basics), My Projects (§24), Settings + EN/IT (§23), shortcuts + reference panel (§22), editor layout (§25) |
| **2 — Creative tools** | Advanced color system (§21), templates (§11), random generator (§10), outfit creator (§9), full version history (§15), Showcase Studio (§12), Pose Studio (§13), before/after comparison (§14) |
| **3 — AI** | AI skin generator (§7), Skin from Image (§8), AI refinements, secure AI backend |
| **4 — Community** | Accounts & profiles (§19), cloud projects, gallery & skin detail pages (§17), likes/favorites/comments/follows, sharing + Open Graph (§20), landing community sections (§2) |
| **5 — Marketplace** | Creator profiles, free & paid products, bundles, Stripe payments, reviews, moderation & reporting (§18) |

## Pages (spec §24) and when they appear

| Page | Phase |
|---|---|
| Home | 1 (community sections in 4) |
| Skin Editor | 1 |
| My Projects | 1 (local), 4 (cloud) |
| Settings | 1 |
| Templates, Random Generator, Outfit Creator, Showcase Studio, Pose Studio | 2 |
| AI Skin Generator, Skin from Image | 3 |
| Community Gallery, Skin Detail, User Profile | 4 |
| Skin Marketplace | 5 |

A page appears in navigation only once it works.

## Edition compatibility

- **Java Edition:** 64×64 RGBA PNG, classic or slim — primary target.
- **Bedrock Edition:** accepts the same 64×64 classic/slim PNG for custom skins.
  Bedrock-only features (128×128 skins, custom geometry, persona items, skin
  packs) are out of scope unless added later; the export dialog explains this.

## Decisions

Recorded owner decisions and clarifications. Pending items are in
`docs/ARCHITECTURE.md` §12 and `docs/DEVELOPMENT_ROADMAP.md` §Decisions.

| # | Decision | Status |
|---|---|---|
| D1 | Frontend: Vite SPA + Supabase Edge Functions (vs Next.js) | Proposed |
| D2 | Brand name and trademark handling | Open |
| D3 | All spec §3 editor tools in Phase 1; spec §21 advanced color in Phase 2 | Proposed |
| D4 | Landing community sections deferred to Phase 4 (no fake data) | Proposed |
| D5 | AI via structured recipes + procedural composer | Proposed |
| D6 | Hosting provider | Open (needed by Phase 4) |
| D7 | AI access for anonymous users (rate-limited) vs account required | Open (needed by Phase 3) |
| D8 | Marketplace legal setup (seller entity, VAT/tax, payouts, age policy) | Open (needed by Phase 5) |
