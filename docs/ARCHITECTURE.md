# Architecture

Technical architecture for the full platform described in `docs/SPECIFICATION.md`.
The rules it implements are in `PROJECT_RULES.md` §1. Build order is in
`docs/DEVELOPMENT_ROADMAP.md`.

Status: **approved design** (decisions D1, D3–D5 approved 2026-11-05) —
nothing is implemented yet. Decisions are summarized in §12.

---

## 1. System overview

```
┌──────────────────────────── Browser (Vite SPA) ─────────────────────────────┐
│                                                                             │
│  features/* (React pages)  ── ui/ (design system) ── i18n/ ── state/ (Zustand)
│        │            │                │                                       │
│        ▼            ▼                ▼                                       │
│   editor2d/     renderer3d/      platform/  (PNG, files, IndexedDB, clipboard)│
│   (Canvas 2D)   (R3F + Three)        │                                       │
│        │            │                │                                       │
│        └────► engine/ ◄──── rig/ ◄───┘     pure TypeScript, no React/DOM     │
│                                                                             │
│   services/  ── typed client for our backend (no secrets) ──────────────┐   │
└─────────────────────────────────────────────────────────────────────────│───┘
                                                                          ▼
┌──────────────────────────── Supabase (Phase 3+) ────────────────────────────┐
│  Edge Functions (secrets live here): ai-design, ai-image-design, og-page,   │
│  stripe-checkout, stripe-webhook, moderation                                │
│  Postgres + Row Level Security · Auth · Storage (skins, thumbnails, OG imgs)│
└──────────────────────────────────────────────────────────────────────────────┘
        │                       │                       │
   AI provider API        Stripe (Connect)         Moderation API
```

- **Phases 1–2 are fully client-side.** No backend, no account. Projects live in
  IndexedDB. This satisfies "use the editor without registering" by design.
- **Phase 3** adds the first server code: Edge Functions that hold AI keys.
- **Phase 4** adds Auth, Postgres, Storage, and sharing.
- **Phase 5** adds Stripe.

---

## 2. Repository layout

```
src/
  engine/            Pure TS skin engine (no React, DOM, Three.js)
    model/           SkinDocument, Layer, PixelBuffer, Rgba, Mask, ids, schema version
    format/          UV region tables (classic/slim, inner/outer), lookup, legacy
                     conversion, import validation, export rules (Java/Bedrock)
    raster/          get/set, blit, brush stamp, line, rect, flood fill, flatten, flip
    mask/            64×64 bit masks: body-part, skin-layer, selection, combine
    symmetry/        mirror maps (limb ↔ limb, within head/body faces)
    tools/           tool state machines: input points → Command
    commands/        Command union, apply, invert
    history/         undo/redo stack, transactions, bounded size
    store/           DocumentStore: sole writer, revisions, change events
    color/           RGB/HSV/HEX conversion, harmony, palettes, quantization (k-means)
    compose/         Skin recipe → texture: parts library, garments, randomizer (Phase 2)
    serialize/       project file format + migrations
    index.ts
  rig/               Pure TS: skeleton, Pose, pose presets, animation clips, sampling
  platform/          Browser adapters: PNG decode/encode, file pick/download,
                     IndexedDB repository, clipboard, screenshot capture
  editor2d/          Canvas 2D editor: viewport, renderer, overlays, input → tools
  renderer3d/        R3F: PlayerModel, skin texture binding, camera rigs, lighting
                     presets, environments, multi-view, screenshot/hi-res render
  ui/                Design system: tokens, Button, Panel, Tooltip, Toast, Dialog,
                     Slider, Tabs, ColorWheel, Splitter, Icon, Logo …
  features/          One folder per page/feature (home, editor, projects, settings,
                     templates, random, outfits, showcase, pose, compare, ai,
                     image-to-skin, gallery, skin-detail, profile, marketplace)
  state/             Zustand stores: settings, editor UI, session, toasts
  i18n/              en.ts (reference), it.ts (typed), t() helper, locale detection
  services/          Typed backend client (Supabase), feature-flag detection of
                     configured services
  content/           Shipped data: palettes, template recipes, outfit presets, pose
                     presets — all original, editable
  app/               Router, layout shell, providers, error boundaries
supabase/            (Phase 3+) migrations/, functions/, seed.sql, RLS tests
public/              favicon, logo, manifest
```

### Import boundaries (enforced by ESLint `no-restricted-imports`)

| Module | May import |
|---|---|
| `engine` | nothing in `src/` |
| `rig` | nothing in `src/` |
| `platform` | `engine` |
| `editor2d` | `engine`, `platform` |
| `renderer3d` | `engine`, `rig`, `platform` |
| `ui` | `i18n` (no business logic) |
| `state` | `engine` (types), `rig` (types) |
| `services` | `engine` (types), `rig` (types) |
| `features/*` | everything above; **not** other features' internals |
| `app` | everything |

`editor2d` ✗ `renderer3d` in both directions. Features that show both views
(editor, compare) compose them; the views never know about each other.

---

## 3. The skin document model

```ts
type SkinModel = 'classic' | 'slim';
type SkinLayer = 'inner' | 'outer';                 // Minecraft's two skin layers
type BodyPart = 'head' | 'body' | 'rightArm' | 'leftArm' | 'rightLeg' | 'leftLeg';
type Face = 'top' | 'bottom' | 'right' | 'front' | 'left' | 'back';

interface PixelBuffer {
  readonly width: 64;
  readonly height: 64;
  readonly data: Uint8ClampedArray;                 // RGBA, straight alpha, row-major
}

type EditorLayerKind = 'paint' | 'outfit';

interface EditorLayer {
  readonly id: LayerId;
  kind: EditorLayerKind;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;                                  // 0..1, applied when flattening
  pixels: PixelBuffer;                              // full 64×64 texture space
  source?: { type: 'outfit'; outfitId: OutfitId };  // provenance, for outfit layers
}

interface SkinDocument {
  readonly schemaVersion: number;
  readonly id: DocumentId;
  name: string;
  model: SkinModel;
  layers: EditorLayer[];                            // ≥ 1; bottom → top
  activeLayerId: LayerId;
  revision: number;                                 // runtime only, not persisted
}
```

Two distinct "layer" concepts — never confuse them:

| Concept | What it is | Where it lives |
|---|---|---|
| **Skin layer** (inner/outer) | A *region* of the 64×64 texture defined by Minecraft (§4–5 of the format doc). Hat, jacket, sleeves, pants are outer. | `engine/format` region tables + `mask` |
| **Editor layer** | A full 64×64 paint layer in the studio, stacked and flattened on export. Used for non-destructive outfits (spec §9). | `SkinDocument.layers` |

"Toggle/edit/erase skin layer" (spec §5) = masks over texture space.
"Apply outfit without losing the original skin" (spec §9) = an `outfit` editor
layer above the base `paint` layer; removing it restores the original exactly.

**The exported skin is `flatten(document)`** — one 64×64 RGBA buffer. Both views
display exactly that buffer (plus optional view filters like hiding the outer
layer), so the 3D model always shows the real exported skin (spec §6).

### Projects and versions

```ts
interface Project {
  id: ProjectId;
  name: string;
  createdAt: string; updatedAt: string;
  document: SerializedDocument;          // current state
  thumbnail: Blob;                       // small PNG render
  versions: VersionMeta[];               // newest first
}
interface VersionMeta {
  id: VersionId; createdAt: string; label: string;
  source: 'manual' | 'autosave' | 'import' | 'ai' | 'template' | 'random' | 'restore';
}
// Version payloads (serialized documents) stored separately, loaded on demand.
```

- **Undo history** is in-memory per editing session (commands).
- **Version history** is persistent snapshots (spec §15). A whole document is
  small (16 KB per editor layer), so versions are full snapshots — simple and
  robust. Restoring a version creates a new version (never destroys history).
- Cloud projects (Phase 4) use the same `SerializedDocument` format.

---

## 4. Editing: tools, masks, commands, history

### 4.1 Edit mask
Every tool writes only where the **active mask** allows:

```
activeMask = bodyPartMask(selectedParts, model)   // spec §4: "edit only that area"
           ∩ skinLayerMask(editableSkinLayers)    // spec §5: "edit layers independently"
           ∩ selectionMask (if a selection exists) // spec §3: selection tool
           ∩ usedPixelsMask (optional: ignore unused texture areas)
```

"Complete skin texture" mode = all parts and both skin layers selected.

### 4.2 Symmetry
`symmetry/` provides a precomputed map `pixelIndex → mirroredPixelIndex | null`
per model: left limb ↔ right limb (face swap + horizontal flip) and left ↔ right
halves within head/body faces. "Mirror drawing" and "Symmetry mode" (spec §3,
§4) apply each stroke to the mirrored pixels in the same command.

### 4.3 Tools
Engine tools are state machines: `begin(point, ctx) / move(point) / end() →
Command | null`, `cancel()`. `ctx` holds color, brush size, active mask,
symmetry, target editor layer. The 2D editor and 3D picking feed the same tools
with texture-space points.

Tool set: pencil (brush size), eraser, paint bucket (flood fill, contiguous,
within face by default), fill (fill whole mask/selection), eyedropper/color
picker (reads flattened or active layer), line, rectangle (outline/filled),
rectangular selection, select by color, move (selection contents), copy/paste
(internal clipboard of pixels + mask), clear selection, clear layer (respecting
skin-layer mask), color replacement.

### 4.4 Commands

```ts
type Command =
  | { kind: 'pixels'; layerId: LayerId; rect: Rect; before: Uint8ClampedArray; after: Uint8ClampedArray }
  | { kind: 'setModel'; before: SkinModel; after: SkinModel; pixelCommands: Command[] }
  | { kind: 'layerProps'; layerId: LayerId; before: LayerProps; after: LayerProps }
  | { kind: 'addLayer'; layer: EditorLayer; index: number }
  | { kind: 'removeLayer'; layer: EditorLayer; index: number }
  | { kind: 'reorderLayer'; layerId: LayerId; from: number; to: number }
  | { kind: 'replaceDocument'; before: SerializedDocument; after: SerializedDocument }
  | { kind: 'batch'; label: I18nKey; commands: readonly Command[] };
```

Pure `apply(doc, cmd)` and `invert(cmd)`. Pixel commands store a dirty-rect
before/after patch. Large operations (apply template, random generate, AI
result) use `replaceDocument` so they are undoable too.

### 4.5 DocumentStore

```ts
interface DocumentStore {
  getSnapshot(): Readonly<SkinDocument>;
  getFlattened(): PixelBuffer;                 // cached per revision
  dispatch(cmd: Command): void;
  beginTransaction(label: I18nKey): void;
  commitTransaction(): void;
  cancelTransaction(): void;
  setPreview(layerId: LayerId, buffer: PixelBuffer | null): void; // live stroke
  undo(): void; redo(): void;
  canUndo(): boolean; canRedo(): boolean;
  history(): readonly HistoryEntry[];           // for the History panel
  subscribe(listener: (c: DocumentChange) => void): () => void;
}
```

### 4.6 Invariants (each has a test)
1. Pixels change only via `dispatch`, `undo`, `redo`, or `load`.
2. `undo` → `redo` is byte-identical (pixels and metadata).
3. N commands then N undos is byte-identical to the start.
4. Every change event has a strictly greater `revision`.
5. A cancelled transaction leaves document and history unchanged.
6. Loading a document clears undo history.
7. Bounded history never alters the current document when trimming.
8. No tool writes outside the active mask.

---

## 5. 2D editor (`editor2d/`)

- Imperative `SkinCanvasEditor` class mounted by a thin React component; React
  never re-renders per pixel.
- Draws a 64×64 offscreen canvas (from `getFlattened()` + preview) scaled with
  `imageSmoothingEnabled = false`; checkerboard for transparency; overlays for
  pixel grid, face outlines/labels, inactive-region dimming, selection marching
  ants, brush cursor.
- Zoom (wheel/pinch/buttons), pan (Space+drag, middle mouse, two-finger).
- Pointer events → texture coordinates → engine tool. Pointer capture and
  coalesced events for smooth strokes; Bresenham between samples.
- Redraws coalesced to one `requestAnimationFrame` per change.

## 6. 3D renderer (`renderer3d/`)

- React Three Fiber + Drei. `PlayerModel` builds boxes for each part (inner +
  inflated outer shell) with UVs **computed from engine region tables**.
- One `THREE.DataTexture` (64×64 RGBA, `NearestFilter`, no mipmaps, sRGB).
  On every store change, copy the flattened buffer into the texture and set
  `needsUpdate` — done in a store subscription, **not** via React state.
  (64×64×4 = 16 KB; a full upload per change is cheap and simpler than sub-rects.)
- Materials: inner layer `alphaTest` cutout; outer layer `transparent` with
  `alphaTest` and `depthWrite` tuned to avoid sorting artifacts; `side`
  double for outer shell. Wireframe and texture-inspection (UV checker/face
  highlight) modes.
- Camera: `OrbitControls` (rotate/zoom/pan), animated presets (front, back,
  side, top, reset), fullscreen via Fullscreen API.
- Lighting presets as data (studio, daylight, sunset, neon, cinematic) + intensity.
- Animation: `rig/` clips sampled per frame in `useFrame`, applied to part
  pivots; pause/resume; custom poses from `rig`.
- Picking for paint-on-model: raycast → face + UV → texel → engine tool.
- Screenshots: `gl.domElement.toBlob` with `preserveDrawingBuffer` only during
  capture; hi-res render via offscreen render target at N× size; transparent
  background via clear alpha.
- **Multiple 3D views** (compare, gallery grids, landing page) share **one WebGL
  context** using Drei `<View>` to avoid browser context limits; gallery
  thumbnails use pre-rendered images, not live canvases.
- Three.js and R3F are lazy-loaded; the landing hero loads them after first paint.

## 7. Rig and animation (`rig/`)

- Skeleton: 6 parts with pivot points in Minecraft model units.
- `Pose = Record<BodyPart, { rx: number; ry: number; rz: number }>` (+ root
  offset). Pose presets and user poses are plain data → saved in IndexedDB,
  reused by Showcase Studio (spec §13).
- Animation clips: keyframed or procedural (sine-based walk/run like the game),
  sampled `sample(clip, t) → Pose`. Pure and unit-tested.

## 8. Procedural composer (`engine/compose/`) — Phase 2+

The key shared piece behind **templates, random generator, outfits, AI, and
skin from image**. It guarantees every generated result is a valid, editable,
correctly mapped Minecraft texture.

```ts
interface SkinRecipe {
  model: SkinModel;
  palette: { skin: Rgba; hair: Rgba; eyes: Rgba; primary: Rgba; secondary: Rgba; accent: Rgba; /* … */ };
  head: { face: FaceStyleId; hair: HairStyleId; facialHair?: StyleId };
  garments: GarmentSpec[];       // shirt, hoodie, jacket, pants, armor, hat, mask, gloves, shoes…
  accessories: AccessorySpec[];
  theme?: ThemeId;
  seed: number;
}
compose(recipe) → { base: PixelBuffer; outfit?: PixelBuffer }
```

- A **parts library** of painters: each part paints into body-part faces using
  face-relative coordinates, model-aware (classic/slim), with shading helpers
  (highlight/shadow/noise from palette). Outer-layer garments (hat, jacket,
  sleeves, pants) paint into outer regions (spec §9).
- **Templates** (spec §11) = curated recipes (+ optional pixel overrides) →
  real editable textures. Search/filter over metadata.
- **Random generator** (spec §10) = random recipe from a seed; locks keep chosen
  recipe fields (e.g. head) fixed between rolls.
- **Outfits** (spec §9) = garment specs rendered into an `outfit` editor layer.
- **AI** (spec §7) and **Skin from Image** (spec §8): the model returns a
  **recipe as JSON** (schema-validated), which the composer renders. See §9.

## 9. AI architecture — Phase 3

Image-generation models produce illustrations, not UV-correct 64×64 textures,
so their output can't be used directly (spec §7 requires valid skin textures).
Proposed pipeline:

1. **Text-to-skin:** Edge Function `ai-design` sends the prompt + options
   (style, colors, presentation, clothing) to an LLM with structured output,
   asking for N `SkinRecipe` variations. Server validates with the shared
   schema, returns recipes. Client composes them → editable skins.
2. **Refine:** current recipe + instruction → updated recipe.
3. **Clothing concepts:** same, scoped to `GarmentSpec`.
4. **Skin from Image:** client downsizes the image, extracts a palette locally
   (k-means in `engine/color`, no upload needed for that part). For AI-assisted
   mode, Edge Function `ai-image-design` sends the image to a vision-capable
   model → recipe. Optional "pixel face" step: crop of the face region quantized
   to 8×8 with the palette and placed on the head front.
5. **Optional image-generation concept art** can be added later for inspiration
   only; it is never written to the texture directly.

- Provider: a vision-capable LLM with structured JSON output (e.g. Claude).
  Wrapped behind a provider interface in the Edge Function.
- Keys only in Supabase secrets. Rate limiting per user/IP; request size limits;
  input validation; uploaded images not stored unless the user publishes.
- If AI credentials are missing, the feature shows "AI service not configured"
  and stays out of navigation (PROJECT_RULES §1.10).

## 10. Persistence

| Data | Phase 1–3 | Phase 4+ |
|---|---|---|
| Projects, versions, thumbnails | IndexedDB (`platform/idb`, small own wrapper) | + Supabase Storage/Postgres sync when signed in |
| Settings, palettes, recent colors, custom poses, favorites | localStorage via Zustand `persist` | synced to profile when signed in |
| Autosave | debounced (default 2 s after last change) to IndexedDB; interval configurable | same |

- Call `navigator.storage.persist()` to reduce eviction risk; offer "export
  project file" for backups.
- Project file (`.mss.json`): `schemaVersion`, metadata, layers as base64 PNG.
  Validated and migrated on load.

## 11. Backend (Phase 3–5)

### 11.1 Hosting
- SPA on a static host with function rewrites (e.g. Vercel, Netlify, or
  Cloudflare Pages). Backend on Supabase.
- **Open Graph** (spec §20): `/s/:slug` is rewritten to the `og-page` function,
  which returns HTML with OG/Twitter meta tags and then boots the SPA. The OG
  image is **rendered in the browser at publish time** (Showcase-style 1200×630
  capture) and uploaded to Storage — no server-side WebGL needed.

### 11.2 Data model (Phase 4–5, sketch)
`profiles`, `projects` (private), `skins` (published: name, description, tags,
category, style, model, png path, og path, counts), `likes`, `favorites`,
`comments`, `follows`, `collections`, `collection_items`, `reports`;
marketplace: `products`, `product_items`, `prices`, `orders`, `entitlements`,
`reviews`, `creator_accounts` (Stripe Connect ids).
Counters maintained by triggers; trending via a scored view/materialized view.

### 11.3 Security
- RLS on every table; owners write their rows; published rows readable by all.
- Storage policies per bucket; uploaded PNGs re-validated server-side
  (exact 64×64 / 64×32, RGBA) before publishing.
- Payments: Stripe Checkout + Connect; webhooks verify signatures; entitlements
  granted only by webhook. No client-side "purchase success" logic.
- Moderation: report flow, admin review queue, automated checks on text
  (and optionally images) before content is public.

## 12. Decisions

Owner decisions are recorded in `docs/PROJECT_OVERVIEW.md` §Decisions.
Architectural consequences:

- **D1 (approved):** Vite SPA + Supabase. No Next.js; server code lives only in
  Supabase Edge Functions (plus a host rewrite for OG pages, §11.1).
- **D2 (deferred):** the brand will be renamed later. All brand text (product
  name, tagline, logo alt text, page titles, meta tags, manifest) comes from
  one place — `src/app/brand.ts` plus the i18n dictionaries — so a rename is a
  one-file change. No brand name in file names, CSS classes, storage keys, or
  identifiers. Storage keys and the project file extension use a neutral
  prefix (`mss`) that survives the rename.
- **D3 (approved):** all spec §3 editor tools in Phase 1; spec §21 advanced
  color features in Phase 2.
- **D4 (approved):** landing community sections wait for Phase 4 real data.
- **D5 (approved):** AI via recipe + composer (§9).
- **D6 (open, before Phase 4):** hosting provider for the SPA and rewrites.

## 13. Dependencies

Each package may be installed only from its phase onward (PROJECT_RULES §1.7).
Versions are pinned to current stable releases at install time.

| Package | Kind | Phase | Why |
|---|---|---|---|
| react, react-dom | runtime | 1 | UI (spec §26) |
| react-router (v7, library mode) | runtime | 1 | 15 pages, deep links, lazy routes |
| zustand | runtime | 1 | App/UI state (spec §26) |
| three | runtime | 1 | 3D engine (spec §26) |
| @react-three/fiber | runtime | 1 | React renderer for Three (spec §26) |
| @react-three/drei | runtime | 1 | OrbitControls, View, Environment helpers (spec §26) |
| tailwindcss (+ @tailwindcss/vite) | dev/build | 1 | Styling (spec §26) |
| typescript, vite, @vitejs/plugin-react | dev | 1 | Build |
| vitest | dev | 1 | Unit tests |
| @testing-library/react, jsdom | dev | 1 | Component tests for critical UI |
| eslint, typescript-eslint, eslint-plugin-react-hooks, prettier | dev | 1 | Quality |
| @playwright/test | dev | 1 (optional) | E2E smoke tests for editor flows |
| zod | runtime | 2 | Shared schema validation (recipes, project files, API I/O) |
| @supabase/supabase-js | runtime | 3 | Backend client |
| supabase (CLI) | dev | 3 | Local backend, migrations |
| AI provider SDK (server only) | server | 3 | In Edge Functions only |
| stripe (server only), @stripe/stripe-js | server / runtime | 5 | Payments (publishable key only in client) |

Explicitly **not** used (write our own): UI kits, icon packs beyond a small
inline SVG set, i18n frameworks (typed dictionaries suffice for 2 languages),
color-picker libraries, IndexedDB libraries, resizable-panel libraries.
