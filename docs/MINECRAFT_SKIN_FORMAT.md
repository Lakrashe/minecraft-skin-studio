# Minecraft Skin Format (Java Edition)

Reference for the texture layout the engine must implement. Engine code in
`src/engine/format/` must match this document; tests encode these tables.

Coordinates are **texture pixels**, origin **top-left**, `x` right, `y` down.
Rectangles are written `(x, y, w, h)`.

> Facts marked **(verify)** should be confirmed against in-game rendering with a
> golden test skin before being relied on. Update this file with the result.

---

## 1. Texture sizes

| Size | Name | Notes |
|---|---|---|
| 64×64 | Modern | Standard since Java 1.8. Separate left arm/leg, overlay layers for all parts. **The engine's internal format.** |
| 64×32 | Legacy | Pre-1.8. No left arm/leg (mirrored from right), only the head overlay (hat). Import-only; convert to 64×64. |

Other sizes (e.g. 128×128 HD) are not vanilla and are rejected on import unless
the specification says otherwise.

PNG must be RGBA (8 bits per channel). Import should accept other PNG color
types by converting to RGBA.

---

## 2. Models

| Model | Also called | Arm width |
|---|---|---|
| `classic` | Steve, wide | 4 px |
| `slim` | Alex | 3 px |

The model is **not stored in the PNG**; it is account/profile metadata. The
studio keeps it in the document and must let the user choose it on import.
Only the arm regions differ between models.

---

## 3. Cuboid UV net

Every body part is a cuboid of width `w`, height `h`, depth `d` (in pixels),
unwrapped from origin `(u, v)` as:

```
            u+d       u+d+w     u+2d+w   u+2d+2w
    u ──────┬─────────┬─────────┬─────────┐
v   │       │  TOP    │ BOTTOM  │         │   row height d
    │       │  w×d    │  w×d    │         │
v+d ├───────┼─────────┼─────────┼─────────┤
    │ RIGHT │  FRONT  │  LEFT   │  BACK   │   row height h
    │  d×h  │   w×h   │   d×h   │   w×h   │
v+d+h└───────┴─────────┴─────────┴─────────┘
```

| Face | Rect |
|---|---|
| top | `(u+d, v, w, d)` |
| bottom | `(u+d+w, v, w, d)` |
| right | `(u, v+d, d, h)` |
| front | `(u+d, v+d, w, h)` |
| left | `(u+d+w, v+d, d, h)` |
| back | `(u+2d+w, v+d, w, h)` |

"Right"/"left" here are the cuboid's sides as named in the net: the "right" face
is the one on the **left** of the net. Name faces consistently in code
(`top | bottom | right | front | left | back`) and never mix with
screen-relative directions.

**Orientation on the model** (as seen from outside; tested face by face in
`renderer3d/core/player-rig.test.ts` and in a real-WebGL browser test):
side faces are upright with the texture's left edge on the viewer's left
(front: player's right side on the left). Top **and bottom** faces both put
the player's right side (−x) on the texture's left and the back (−z) on the
texture's top row — so the bottom face looks flipped vertically compared with
the side faces, the convention of established skin renderers (skinview3d).
Confirm against the game with an asymmetric test skin **(verify)**.

---

## 4. Region table (64×64)

Size is `w × h × d`. Origin is the `(u, v)` of the net.

| Part | Size | Base origin | Overlay origin | Overlay name |
|---|---|---|---|---|
| Head | 8×8×8 | (0, 0) | (32, 0) | Hat |
| Body | 8×12×4 | (16, 16) | (16, 32) | Jacket |
| Right arm (classic) | 4×12×4 | (40, 16) | (40, 32) | Right sleeve |
| Left arm (classic) | 4×12×4 | (32, 48) | (48, 48) | Left sleeve |
| Right arm (slim) | 3×12×4 | (40, 16) | (40, 32) | Right sleeve |
| Left arm (slim) | 3×12×4 | (32, 48) | (48, 48) | Left sleeve |
| Right leg | 4×12×4 | (0, 16) | (0, 32) | Right pants |
| Left leg | 4×12×4 | (16, 48) | (0, 48) | Left pants |

"Right"/"left" limbs are the **player's** right/left. Viewed from the front, the
player's right arm is on the viewer's left.

### Derived face rects (examples, for tests)

Head base: top `(8,0,8,8)`, bottom `(16,0,8,8)`, right `(0,8,8,8)`,
front `(8,8,8,8)`, left `(16,8,8,8)`, back `(24,8,8,8)`.

Body base: top `(20,16,8,4)`, bottom `(28,16,8,4)`, right `(16,20,4,12)`,
front `(20,20,8,12)`, left `(28,20,4,12)`, back `(32,20,8,12)`.

Right arm base, classic: top `(44,16,4,4)`, bottom `(48,16,4,4)`,
right `(40,20,4,12)`, front `(44,20,4,12)`, left `(48,20,4,12)`, back `(52,20,4,12)`.

Right arm base, slim: top `(44,16,3,4)`, bottom `(47,16,3,4)`,
right `(40,20,4,12)`, front `(44,20,3,12)`, left `(47,20,4,12)`, back `(51,20,3,12)`.

### Unused pixels
Pixels not covered by any face are unused. In slim skins the 1-px-wide strips
freed by the narrower arms are unused. The editor should show unused areas as
non-paintable (or clearly marked) and export should preserve or clear them
consistently (decision per spec; default: preserve).

The engine must provide a test that computes every face rect from the table
above and asserts: no two faces of base layers overlap, no two faces of overlay
layers overlap, and all rects lie inside 64×64.

---

## 5. Layers and transparency

- **Base layer** (inner): expected to be fully opaque. Java Edition forces the
  base-layer alpha to 255 when it loads a skin, so a transparent base pixel shows
  its RGB (often black) instead of being see-through. The 3D preview does the
  same (the inner material ignores alpha). Export should warn about non-opaque
  base pixels; whether to auto-fill them is a spec decision.
- **Outer cut-off:** the game's entity shaders discard pixels below 10 % alpha;
  the preview uses the same 0.1 cut-off.
- **Overlay layer** (outer): transparent pixels are see-through. Rendered as a
  slightly larger shell around the base part.
- **Semi-transparent** overlay pixels (alpha 1–254): handling differs across
  versions and editions **(verify)**. The studio should allow them but may warn.
- Overlay shell inflation in the 3D preview: hat +0.5 px per side; jacket,
  sleeves, pants +0.25 px per side.
- **Legacy hat quirk:** for legacy 64×32 skins, if the hat region is fully
  opaque, the game may treat it as transparent **(verify)**. On import, detect a
  fully opaque, single-color hat region and offer to clear it.

---

## 6. Legacy 64×32 → 64×64 conversion

1. Copy the 64×32 image into the top half of a new transparent 64×64 buffer.
2. Create the **left leg** at origin (16, 48) from the right leg at (0, 16).
3. Create the **left arm** at origin (32, 48) from the right arm at (40, 16).
4. For each copied limb, every face is **mirrored horizontally**, and the
   `right` and `left` side faces **swap places** (the outer side of the right limb
   becomes the outer side of the left limb). `top`, `bottom`, `front`, `back`
   stay in their slots but are mirrored.
5. Overlay regions that did not exist in legacy (jacket, sleeves, pants) remain
   fully transparent.
6. Legacy skins are always classic model.

Tests: convert a synthetic legacy skin where every face has a unique color and
a unique asymmetric marker pixel; assert every destination face.

---

## 7. Common engine operations (must be tested)

| Operation | Notes |
|---|---|
| Region lookup | `(part, face, layer, model) → Rect` and `(x, y, model) → {part, face, layer} \| null` |
| Fill within face/part | Flood fill bounded by the face rect, not the whole texture |
| Mirror painting | Paint a pixel on a limb and mirror to the matching pixel on the opposite limb (face swap + horizontal mirror, as in §6) |
| Copy/swap parts | Copy right arm ↔ left arm, base ↔ overlay |
| Flip part/face | Horizontal/vertical flip within a rect |
| Classic → slim | Remove 1 px column from front/back/top/bottom of each arm and shift remaining faces; method (which column) per spec |
| Slim → classic | Insert 1 px column (duplicate an edge column) and shift faces |
| Flatten | Composite editor layers (alpha-over) into one RGBA buffer |
| Validate export | Size 64×64, RGBA, base opacity warnings |

---

## 8. Java vs Bedrock export (spec §16)

| | Java Edition | Bedrock Edition |
|---|---|---|
| 64×64 classic/slim PNG | ✅ primary format | ✅ accepted as a custom skin |
| Legacy 64×32 | ✅ (converted on import; export always 64×64) | ✅ but export 64×64 |
| 128×128 HD | ❌ not vanilla | ✅ Bedrock only — **out of scope** for now |
| Model selection | Chosen on the account/launcher upload | Chosen in the dressing room / skin import |
| Semi-transparent outer pixels | **(verify)** | **(verify)** |
| Custom geometry, persona items, skin packs | ❌ | Bedrock only — **out of scope** for now |

The export dialog must state: the PNG does not store the model type (the user
must choose classic/slim when uploading), HD and custom geometry are not
supported, and any warnings found (e.g. transparent inner-layer pixels).

## 9. 3D model geometry (for `renderer3d`)

Units: 1 texture pixel = 1 model unit; player is 32 units tall.

The player faces +z; their right side is −x.

| Part | Size (w×h×d) | Pivot (joint) | Box center |
|---|---|---|---|
| Head | 8×8×8 | (0, 24, 0) neck | y 28 |
| Body | 8×12×4 | (0, 24, 0) | y 18 |
| Right arm | 4×12×4 (slim 3×12×4) | (−5, 22, 0) shoulder; slim (−5, 21.5, 0) | x −(4 + w/2), y 18 (slim 17.5) |
| Left arm | same | (5, 22, 0); slim (5, 21.5, 0) | x 4 + w/2, y 18 (slim 17.5) |
| Right leg | 4×12×4 | (−1.9, 12, 0) hip | x −1.9, y 6 |
| Left leg | 4×12×4 | (1.9, 12, 0) | x 1.9, y 6 |

Values follow Java Edition's player model:
- **Hips at ±1.9**, not ±2: legs sit 0.1 inside the body outline and overlap
  0.2 at the center (the overlap is hidden inside the legs).
- **Slim arms hang half a pixel lower** (shoulder joint 2.5 below the neck
  instead of 2) **(verify)** — skinview3d does not do this.
- Overlay inflation: 0.5 per side for the hat, 0.25 for jacket, sleeves, pants.

Implemented in `src/renderer3d/core/player-geometry.ts` and built as Three.js
meshes by `core/player-rig.ts`; both are tested in Node (sizes, joints and the
UV of every face corner for both models).
