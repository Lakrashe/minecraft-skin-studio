# Development Roadmap

Implementation plan for `docs/SPECIFICATION.md`, following its five phases
(spec §28). Architecture is in `docs/ARCHITECTURE.md`.

## How this roadmap is used

- **Only the phase the owner explicitly approves is implemented.** Milestones
  inside it are worked in order. Nothing from a later phase is started early.
- A milestone is done when its acceptance criteria are met and
  `typecheck`, `lint`, and `test` pass. A phase is done when all its milestones
  are done and the owner has reviewed it.
- Every milestone ends with a usable app: no dead buttons, no stub pages.
  UI for a feature is added in the same milestone as the feature's logic.

**Status:** Phase 1 in progress. Done: 1.1–1.2 ("Project Foundation") and the
owner's "Homepage and User Interface" step, which built 1.16 (acceptance still
open: Lighthouse not measured) and parts of 1.3, 1.9, 1.10 and 1.14 (marked
below); its audit corrections are applied. The owner's "Advanced 2D Minecraft
Skin Editor" step (called "Phase 3" by the owner) then built most of 1.4, 1.5,
1.6 and 1.8 and more of 1.3 and 1.9 (marked below). Biggest gaps for a usable
product: saving (1.13) and PNG import/export (1.12).

> Naming note: the owner called the homepage step "Phase 2", the editor
> step "Phase 3", the 3D rendering step "Phase 4" and the synchronization step
> "Phase 5". In this roadmap, Phase 2 remains *Creative tools*, Phase 3 *AI*,
> Phase 4 *Community* and Phase 5 *Marketplace*; all four owner steps belong to
> Phase 1.

---

## Phase 0 — Foundation ✅
Project rules, agent entry files, specification, overview, architecture, skin
format reference, this roadmap.

---

## Phase 1 — Core product

Goal: a polished, fully working local skin editor with synchronized 3D preview,
import/export, local projects, and a landing page.

### 1.1 Scaffold and tooling ✅
- Vite + React + TS (strict flags per PROJECT_RULES §1.5), Tailwind, React Router.
- ESLint with import-boundary rules, Prettier, Vitest (Node for engine, jsdom for UI).
- Folder layout from ARCHITECTURE §2 with `index.ts` per module.
- Typed i18n (EN reference + IT), CI running typecheck/lint/test.
- Playwright e2e against the production build (desktop + mobile).
- Three.js + R3F + Drei installed; lazy `SceneCanvas` in its own chunk.
- **Accept:** clean clone installs and passes all checks; a forbidden import fails lint; a missing Italian key fails typecheck.

### 1.1–1.2 audit corrections ✅
An independent foundation audit (2026-11-05) found no P0/P1 issues. Applied:
failure-safe settings storage with an honest "can't be saved" notice; WebGL2-only
detection plus a renderer-failure fallback; DOM-free engine/rig typecheck,
dynamic-import and deep-import lint bans with fixture tests; tooltip Escape
dismissal, hoverable bubble and preserved `aria-describedby`; Node `engines`
aligned with locked tools and tested in CI; i18n empty-value test fixed; e2e
checks runtime errors in every test. The minimatch dev-tool advisory is
recorded as accepted risk (ARCHITECTURE §13).

### 1.2 Design system and app shell ✅
*Done; Tabs and Splitter are deferred to 1.14, where the editor layout first
needs them (no unused components).*
- Tokens (dark default + light, charcoal/near-black, green accent, user accent
  colors), typography, radii, motion with reduced-motion support.
- Primitives: Button, IconButton, Panel, Tooltip, Toast, Dialog, Tabs, Slider,
  Toggle, Input, Splitter, Spinner/loading states, Kbd.
- Original logo + favicon (no Mojang logo likeness), designed so the wordmark
  can be swapped when the brand is renamed (D2); `src/app/brand.ts`.
- Shell: header navigation (only built pages), responsive layout, error
  boundary, 404 page.
- **Accept:** theme and accent switch live and persist; all primitives keyboard-accessible; layouts work at phone/tablet/desktop widths.

### 1.3 Engine core (partly done)
*Done: types, `PixelBuffer` basics, region tables and lookup, edit masks
(part × skin layer, unused areas excluded), mirror maps, line/rectangle/flood
fill shapes (all tested). Remaining: flatten of editor layers, legacy
conversion, import validation, export rules.*
- PixelBuffer, Rgba, raster ops, region tables (classic/slim × inner/outer),
  region lookup, masks (part, skin layer, used pixels), symmetry maps,
  flatten, legacy 64×32 conversion, import validation, export rules.
- **Accept:** tests for every face rect, non-overlap, lookup round-trip, mask
  correctness, symmetry pairs, legacy conversion with synthetic fixtures.

### 1.4 Document store and history (partly done)
*Done: immutable `SkinDocument` (model + 64×64 texture), pixel/model/replace
commands with apply/invert, `DocumentStore` with bounded history (200),
revisions, live stroke preview and subscriptions; §4.6 invariants 1–4, 6–8
tested. Remaining: transactions (invariant 5), serialization + migrations,
editor layers.*
- Commands, apply/invert, transactions, bounded history, revisions, preview
  buffer, serialization + migrations.
- **Accept:** all invariants in ARCHITECTURE §4.6 tested.

### 1.5 2D canvas editor (built; acceptance partly verified)
*Done: pixel-exact canvas, checkerboard, zoom (buttons, keys, Ctrl+wheel at the
pointer, two-finger pinch), pan (Space-drag, middle mouse, two fingers, Pan
tool, scrollbars), grid, face outlines, dimming outside the editable area,
body-part selector, layer visibility and "Paint on" editability. A second
finger cancels the stroke the first one started. Optional face labels (from 6×
zoom, longest translated name that fits). Acceptance status: coordinate math is
unit-tested; exact-texel painting is browser-tested at the default zoom only.*
- Canvas rendering, transparency checkerboard, zoom/pan (mouse, trackpad,
  touch), pixel grid toggle, face outlines and labels, inactive-area dimming.
- Body-part selector and full-texture mode; inner/outer skin-layer visibility
  and editability toggles.
- **Accept:** coordinate transforms tested; painting lands on the exact texel at every zoom.

### 1.6 Drawing tools (mostly done)
*Done: pencil, eraser, bucket (within one face), eyedropper, line, rectangle
(outline/filled), mirror drawing; one history entry per stroke; undo/redo
buttons and shortcuts. Remaining: brush size, fill-whole-area, clear layer.*
- Pencil (brush size), eraser, paint bucket, fill, eyedropper/color picker,
  line, rectangle, mirror drawing, symmetry mode, clear layer.
- Each stroke = one history entry; undo/redo buttons + shortcuts.
- **Accept:** each tool unit-tested in the engine, including mask and symmetry behavior.

### 1.7 Selection tools
- Rectangular selection, select by color, move, copy/paste, clear selection,
  color replacement (within selection/mask).
- **Accept:** tested in engine; paste/move are single undoable entries.

### 1.8 Color panel (mostly done)
*Done: HSV picker (area + hue + opacity), HEX input with alpha and validation,
built-in palettes, custom palettes saved on the device. Remaining: RGB inputs,
recently used colors.*
- Color wheel (own component), HEX and RGB inputs, recently used colors,
  custom palettes, saved palettes (persisted).
- **Accept:** inputs validate and stay in sync; palettes persist across reloads.

### 1.9 3D viewer (partly done)
*Done: player model from engine UVs, classic/slim, inner/outer toggles, per-part
visibility, orbit controls, camera presets, fullscreen, no-WebGL fallback.
Live updates from the document store (every stroke, undo and redo). Owner's
"Phase 4" step: React-free rendering core (`renderer3d/core`), Java-accurate
geometry (hips ±1.9, slim shoulders 0.5 lower — verify), Java transparency
rules, lighting presets + intensity, flat exact-color mode, 360° turntable;
geometry and every face's UVs tested in Node, face colors tested in real
WebGL. Resource release tested (every geometry, material and texture; no
skin texture left after model switches or leaving the Studio). Owner's
"Phase 5" step: live 2D → 3D synchronization through a skin source (no React
re-render of the 3D view per edit), per-row partial texture uploads, texel ↔
surface mapping, exhaustive raycast tests and per-pixel real-WebGL tests;
full texture rebuild after WebGL context loss (audit fix, tested).
Remaining: wireframe, texture inspection, screenshots, animated camera
transitions.*
- PlayerModel with engine-derived UVs; classic/slim; outer-layer toggle;
  per-part visibility; correct transparency; instant updates from the store.
- Orbit rotate/zoom/pan, front/back/side/top/reset presets, fullscreen,
  wireframe, texture-inspection mode.
- Lighting presets (studio, daylight, sunset, neon, cinematic) + intensity.
- Screenshot (PNG, optional transparent background).
- **Accept:** synthetic face-colored skin shows each color on the correct face for both models; 2D edits appear in 3D in the same frame; no GPU resource leaks on remount.

### 1.10 Animations and preview poses (partly done)
*Done: `rig/` module with idle and walk, pause/resume. Remaining: running,
jumping, waving, dancing, preview poses.*
- `rig/` module; idle, walking, running, jumping, waving, dancing; pause/resume;
  a small set of preview poses.
- **Accept:** clip sampling unit-tested; animations run at 60 fps on a mid-range laptop.

### 1.11 Paint on the 3D model
- Raycast → texel → same engine tools as 2D.
- **Accept:** picking math tested; a 3D stroke is one history entry and appears identically in 2D.

### 1.12 Import and export
- Import PNG: validate dimensions/format, detect 64×64 vs legacy 64×32, choose
  classic/slim (with auto-suggestion from arm pixels), preview before applying.
- Export: Minecraft PNG with Java/Bedrock notes and warnings (e.g. transparent
  inner-layer pixels); project file (`.mss.json`) save/load.
- **Accept:** import→export round-trip is byte-exact for valid skins; invalid files give clear, translated errors.

### 1.13 Local projects and autosave
- IndexedDB repository; autosave (configurable); manual save (Ctrl+S); version
  snapshots on manual save; My Projects page: open, rename, duplicate, delete
  (with confirmation), thumbnails; new blank skin.
- **Accept:** reload restores the last state; deleting asks for confirmation; storage errors surface as toasts.

### 1.14 Editor layout, shortcuts, history panel (partly done)
*Done: Studio layout (left/center/right/bottom, mobile tabs) in viewer mode.
Remaining: top-bar project actions (as their features land), resizable panels,
history panel, shortcuts.*
- Top bar, left/center/right/bottom panels per spec §25; resizable and
  collapsible panels with persisted layout; mobile/tablet layout.
- Drawing history panel (jump to entry), status bar (cursor texel, part/face,
  zoom, color), keyboard shortcut reference panel, customizable shortcuts.
- **Accept:** every spec §22 shortcut works and can be rebound; no control in the layout is non-functional.

### 1.15 Settings
- Theme, accent, editor preferences, grid settings, autosave settings, animation
  preferences, language (EN/IT), shortcut customization.

### 1.16 Landing page (built; acceptance open)
*Built in the homepage step; stays open until the Lighthouse criterion below
is measured.*
- 3D hero (slow rotation, animated background, headline/subtitle, CTAs),
  feature cards with honest status badges, sample characters (D9), accuracy
  section, FAQ, final CTA, footer.
- Primary CTA reads "Open the Studio" until drawing works, then "Start
  Creating" (D10). "Explore Community Skins" and community sections arrive in
  Phase 4.
- Not yet measured: Lighthouse score (run before Phase 1 sign-off). Also not
  yet verified: real Firefox/WebKit, physical phones, screen-reader output and
  in-game skin appearance.
- 3D views honor reduced motion, pause offscreen, and the homepage character
  has a pause control (homepage audit corrections).
- **Accept:** Lighthouse performance ≥ 85 on desktop with 3D lazy-loaded; no fake data.

---

## Phase 2 — Creative tools
- **2.1 Advanced color system:** preset palettes, saved colors, harmony
  generator (complementary, analogous, triadic…), random palettes, global color
  replacement, replace selected colors.
- **2.2 Procedural composer:** recipe schema (zod), parts library (faces, hair,
  garments, accessories, shading), classic/slim aware. Heavily unit-tested.
- **2.3 Templates:** curated recipes for all 16 categories, 2D + 3D preview,
  apply/customize, favorites, search, category filter.
- **2.4 Random generator:** seeded generation, themes/styles, locks per part
  (head, outfit, colors, accessories).
- **2.5 Outfit creator:** categories from spec §9, presets, colors, mix & match,
  saved outfits and collections, applied as non-destructive outfit layers.
- **2.6 Version history:** timeline UI, restore (creates a new version), export
  any version.
- **2.7 Pose Studio:** per-part rotation gizmos/sliders, presets (standing,
  walking, action, dancing, sitting, running), save/reuse poses, reset, screenshot mode.
- **2.8 Showcase Studio:** camera angles, poses, environments (studio,
  grassland, Nether-inspired, End-inspired, futuristic city, neon room,
  fantasy, transparent), lighting, shadows, cinematic effects, hi-res export.
- **2.9 Before/after comparison:** side-by-side 2D and 3D, slider, synchronized
  rotation, compare versions/original/edited.

## Phase 3 — AI
- **3.1 Backend foundation:** Supabase project, Edge Functions, secrets,
  rate limiting, service-configured detection in the client.
- **3.2 AI skin generator:** prompt + options → N recipe variations → composed
  editable skins; regenerate; refine; clothing concepts; loading and error states.
- **3.3 Skin from Image:** upload + preview, local palette extraction, style
  selection, local pixel-art conversion for face details, AI-assisted recipe,
  manual refinement in the editor, 3D preview.
- **Accept:** with credentials missing, the feature shows an honest
  "not configured" state; with them present, every result is a valid editable skin.

## Phase 4 — Community
- **4.1 Auth & profiles:** sign up, login, password recovery, profile picture,
  username, account settings.
- **4.2 Cloud projects:** sync local ↔ cloud, conflict handling.
- **4.3 Publishing & gallery:** publish flow (validation, metadata, OG image),
  gallery (trending, newest, most downloaded, most liked), search/filters,
  lazy loading, skin detail pages, similar skins.
- **4.4 Social:** likes, favorites, comments, follows, creator pages,
  collections, sharing links, OG pages, embeds.
- **4.5 Moderation basics:** reports, admin queue, text filtering.
- **4.6 Landing community sections** from real data.

## Phase 5 — Marketplace
- Stripe Connect onboarding for creators, products (skins, outfit packs,
  bundles, premium templates), checkout, webhooks → entitlements, downloads of
  purchased items, ratings/reviews, featured products, creator collections,
  upload moderation, reporting, refunds handling.
- Marketplace is isolated: the free editor never depends on it.

---

## Technical risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | **Brand/trademark:** Mojang's usage guidelines restrict using "Minecraft" in product names and logos. | Takedown, forced rename after launch | Rename before public launch (D2, deferred); brand text centralized so the rename is one change; non-affiliation notice; original logo; no Mojang assets. |
| R2 | **UV/orientation errors** (bottom faces, mirrored limbs, slim arms). | Skins look wrong in game | Region tables as single source; golden tests; one-time manual in-game verification of a test skin per model. |
| R3 | **AI output validity:** image models can't produce UV-correct skins. | Unusable AI feature | Recipe + composer pipeline (ARCHITECTURE §9); quality depends on parts library breadth. |
| R4 | **AI cost and abuse.** | Unbounded bills | Server-side rate limits, quotas, optional account requirement (D7), request size limits. |
| R5 | **Scope size:** 15 pages, 5 phases. | Half-finished features | Strict phase gating; no stubs; each milestone shippable. |
| R6 | **2D/3D sync performance** via React re-renders. | Laggy editing | Imperative subscriptions, rAF coalescing, 16 KB texture uploads, no pixel data in React/Zustand state. |
| R7 | **WebGL context limits** with many 3D views (compare, gallery, landing). | Black canvases, crashes | One context with Drei `<View>`; static thumbnails in grids; dispose on unmount. |
| R8 | **Mobile pixel editing UX** and performance on low-end devices. | Poor tablet/phone experience | Touch gestures designed in 1.5; adaptive DPR; 3D quality presets. |
| R9 | **Local data loss** (IndexedDB eviction, private mode). | Lost work | `storage.persist()`, autosave, export project file, clear warnings when storage is unavailable. |
| R10 | **Template/outfit content volume** (16 categories, 10 outfit categories). | Thin library | Composer makes content data-driven; budget art time; start with fewer, high-quality items per category. |
| R11 | **Minors and community safety** (Minecraft audience skews young; EU/GDPR, COPPA). | Legal exposure | Age gate/terms, comment moderation, reporting, privacy policy before Phase 4. |
| R12 | **Copyright in community uploads** (skins of copyrighted characters). | Takedowns | Report + takedown process, terms of service. |
| R13 | **Marketplace payments, VAT, payouts** (EU/Italy). | Legal/financial | Stripe Connect handles payouts/KYC; tax setup decided before Phase 5 (D8). |
| R14 | **Supabase RLS mistakes** expose private data. | Data leak | RLS on every table, policy tests, least-privilege functions. |
| R15 | **Open Graph with an SPA.** | No social previews | Rewrite share URLs to an OG function; client-rendered OG images at publish time. |

## Decisions

All pre-Phase-1 decisions are settled (see `docs/PROJECT_OVERVIEW.md`
§Decisions): D1, D3, D4, D5 approved; D2 (brand rename) deferred to before
public launch. Still open: D6 hosting (before Phase 4), D7 AI access for
anonymous users (before Phase 3), D8 marketplace legal setup (before Phase 5).
