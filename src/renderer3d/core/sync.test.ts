/**
 * 2D ↔ 3D synchronization, end to end without WebGL: the editor's document
 * store and drawing tools drive a real Three.js `PlayerRig` through a
 * `SkinSource`, and raycasts against the rig's meshes check *where* on the
 * body each painted pixel appears (hit UV → texel → the uploaded texture).
 */
import { Raycaster, Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';
import {
  BODY_PARTS,
  DocumentStore,
  SKIN_HEIGHT,
  SKIN_MODELS,
  SKIN_WIDTH,
  Stroke,
  blankDocument,
  editMask,
  regionAt,
  type Rgba,
  type SkinLayer,
  type SkinModel,
} from '@/engine';
import { NEUTRAL_POSE } from '@/rig';
import { PlayerRig } from './player-rig';
import { connectSkinSource, type SkinSource } from './skin-source';
import { texelSurface, uvToTexel } from './surface';

const RED: Rgba = { r: 255, g: 0, b: 0, a: 255 };
const GREEN: Rgba = { r: 0, g: 200, b: 0, a: 255 };

function rigFor(model: SkinModel) {
  const rig = new PlayerRig(model);
  rig.setPose(NEUTRAL_POSE);
  rig.root.updateMatrixWorld(true);
  return rig;
}

/** Raycasts at a texel's surface point, as a viewer looking at that face would. */
function hitTexel(rig: PlayerRig, model: SkinModel, x: number, y: number) {
  const surface = texelSurface(model, x, y);
  if (!surface) throw new Error(`texel ${String(x)},${String(y)} is unused`);
  const entry = rig.meshes.find((m) => m.part === surface.part && m.layer === surface.layer);
  if (!entry) throw new Error('missing mesh');
  const normal = new Vector3(...surface.normal);
  const origin = new Vector3(...surface.point).addScaledVector(normal, 3);
  const raycaster = new Raycaster(origin, normal.clone().negate());
  const [hit] = raycaster.intersectObject(entry.mesh, false);
  return { surface, hit };
}

/** The color the rig's uploaded texture holds where a ray hits the surface of texel (x, y). */
function colorOnBody(rig: PlayerRig, model: SkinModel, x: number, y: number): Rgba {
  const { hit } = hitTexel(rig, model, x, y);
  if (!hit?.uv) throw new Error('no hit');
  const t = uvToTexel(hit.uv.x, hit.uv.y);
  const data = rig.texture.image.data as Uint8Array;
  const i = (t.y * SKIN_WIDTH + t.x) * 4;
  return { r: data[i] ?? 0, g: data[i + 1] ?? 0, b: data[i + 2] ?? 0, a: data[i + 3] ?? 0 };
}

function storeSource(store: DocumentStore): SkinSource {
  return {
    getSkin: () => store.getSnapshot().texture,
    subscribe: (fn) => store.subscribe(fn),
  };
}

function paint(
  store: DocumentStore,
  x: number,
  y: number,
  color: Rgba,
  layers: SkinLayer[] = ['inner', 'outer'],
) {
  const { model, pixels } = store.document;
  const stroke = new Stroke(
    'pencil',
    pixels,
    { color, mask: editMask(model, 'all', layers), model, mirror: false },
    { x, y },
  );
  const command = stroke.finish();
  if (command) store.dispatch(command);
}

describe('every texel lands on its own body surface (raycast, all faces)', () => {
  it.each(SKIN_MODELS)('%s: hit UV at each used texel maps back to that texel', (model) => {
    const rig = rigFor(model);
    let checked = 0;
    for (let y = 0; y < SKIN_HEIGHT; y++) {
      for (let x = 0; x < SKIN_WIDTH; x++) {
        if (!regionAt(x, y, model)) {
          expect(texelSurface(model, x, y)).toBeNull();
          continue;
        }
        const { surface, hit } = hitTexel(rig, model, x, y);
        const where = `${model} ${surface.part} ${surface.layer} ${surface.face} (${String(x)},${String(y)})`;
        expect(hit, where).toBeDefined();
        if (!hit?.uv || !hit.face) continue;
        expect(uvToTexel(hit.uv.x, hit.uv.y), where).toEqual({ x, y });
        expect(hit.point.distanceTo(new Vector3(...surface.point)), where).toBeLessThan(1e-6);
        // The face points outward along the expected normal (within float rounding).
        expect(hit.face.normal.distanceTo(new Vector3(...surface.normal)), where).toBeLessThan(
          1e-9,
        );
        checked++;
      }
    }
    // Both layers of every part: classic 3264 texels, slim 3136.
    expect(checked).toBe(model === 'classic' ? 3264 : 3136);
  });

  it('texels sit on the right part and side of the body', () => {
    // Head front (8,8): the player's right side (−x), top of the head.
    expect(texelSurface('classic', 8, 8)).toMatchObject({ part: 'head', face: 'front' });
    const head = texelSurface('classic', 8, 8)?.point ?? [0, 0, 0];
    expect(head[0]).toBeLessThan(0);
    expect(head[1]).toBeGreaterThan(31);
    expect(head[2]).toBe(4);
    // Hat front sits on the inflated shell, in front of the head.
    expect(texelSurface('classic', 40, 8)?.point[2]).toBe(4.5);
    // Left leg front is on +x; right leg front on −x.
    expect(texelSurface('classic', 20, 52)?.point[0]).toBeGreaterThan(0);
    expect(texelSurface('classic', 4, 20)?.point[0]).toBeLessThan(0);
    // Slim arms: 3 wide, half a pixel lower.
    expect(texelSurface('slim', 44, 20)).toMatchObject({ part: 'rightArm', face: 'front' });
    expect(texelSurface('slim', 44, 20)?.point).toEqual([-6.5, 23, 2]);
    expect(texelSurface('classic', 44, 20)?.point).toEqual([-7.5, 23.5, 2]);
  });

  it('uvToTexel clamps to the texture', () => {
    expect(uvToTexel(0, 0)).toEqual({ x: 0, y: 0 });
    expect(uvToTexel(1, 1)).toEqual({ x: 63, y: 63 });
    expect(uvToTexel(8.5 / 64, 8.5 / 64)).toEqual({ x: 8, y: 8 });
  });
});

describe('editing → 3D texture, live', () => {
  const MARKERS: readonly [string, number, number][] = [
    ['head front', 9, 10],
    ['head right side', 1, 12],
    ['head top', 10, 2],
    ['head bottom', 18, 3],
    ['body back', 33, 22],
    ['right arm front', 45, 22],
    ['left arm left side', 41, 57],
    ['right leg back', 13, 25],
    ['left leg front', 21, 53],
    ['hat front (outer)', 41, 9],
    ['jacket front (outer)', 22, 38],
    ['left sleeve back (outer)', 61, 57],
  ];

  it.each(SKIN_MODELS)(
    '%s: each painted pixel appears on its surface; undo/redo follow',
    (model) => {
      const store = new DocumentStore(blankDocument(model));
      const rig = rigFor(model);
      const disconnect = connectSkinSource(rig, storeSource(store));
      for (const [name, x, y] of MARKERS) {
        if (!regionAt(x, y, model)) continue;
        paint(store, x, y, RED);
        expect(colorOnBody(rig, model, x, y), name).toEqual(RED);
        // Its neighbors on the same face stay untouched (still transparent).
        for (const [dx, dy] of [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1],
        ] as const) {
          const n = regionAt(x + dx, y + dy, model);
          if (n?.face === regionAt(x, y, model)?.face && n?.part === regionAt(x, y, model)?.part) {
            expect(colorOnBody(rig, model, x + dx, y + dy).a, `${name} neighbor`).toBe(0);
          }
        }
        store.undo();
        expect(colorOnBody(rig, model, x, y).a, `${name} after undo`).toBe(0);
        store.redo();
        expect(colorOnBody(rig, model, x, y), `${name} after redo`).toEqual(RED);
      }
      disconnect();
    },
  );

  it('the live stroke preview shows in 3D before it is committed, and cancels cleanly', () => {
    const store = new DocumentStore(blankDocument());
    const rig = rigFor('classic');
    connectSkinSource(rig, storeSource(store));
    store.setPreview(new Map([[10 * 64 + 9, GREEN]]));
    expect(colorOnBody(rig, 'classic', 9, 10)).toEqual(GREEN);
    store.setPreview(null);
    expect(colorOnBody(rig, 'classic', 9, 10).a).toBe(0);
  });

  it('inner and outer layers stay separate: a hat pixel is on the shell, not the head', () => {
    const store = new DocumentStore(blankDocument());
    const rig = rigFor('classic');
    connectSkinSource(rig, storeSource(store));
    paint(store, 41, 9, RED, ['outer']); // hat front
    paint(store, 9, 9, GREEN, ['inner']); // head front, same spot underneath
    expect(hitTexel(rig, 'classic', 41, 9).surface.layer).toBe('outer');
    expect(colorOnBody(rig, 'classic', 41, 9)).toEqual(RED);
    expect(colorOnBody(rig, 'classic', 9, 9)).toEqual(GREEN);
    // Layer visibility is synchronized on the meshes themselves.
    rig.setVisibility({ showInner: true, showOuter: false });
    expect(rig.meshes.find((m) => m.part === 'head' && m.layer === 'outer')?.mesh.visible).toBe(
      false,
    );
    expect(rig.meshes.find((m) => m.part === 'head' && m.layer === 'inner')?.mesh.visible).toBe(
      true,
    );
  });

  it('uploads only what changed: one pixel = 4 bytes, none for model-only changes', () => {
    const store = new DocumentStore(blankDocument());
    const rig = rigFor('classic');
    const onUpdated = vi.fn();
    connectSkinSource(rig, storeSource(store), onUpdated);
    expect(rig.lastUploadBytes).toBe(64 * 64 * 4); // first upload: whole texture
    rig.texture.onUpdate?.(rig.texture); // the GPU now holds it (as the renderer reports)

    paint(store, 9, 10, RED);
    expect(rig.lastUploadBytes).toBe(4);
    expect(rig.texture.updateRanges).toEqual([{ start: (10 * 64 + 9) * 4, count: 4 }]);
    rig.texture.clearUpdateRanges();

    onUpdated.mockClear();
    store.dispatch({ kind: 'setModel', before: 'classic', after: 'slim' });
    expect(onUpdated).not.toHaveBeenCalled(); // same pixels: nothing to upload or draw

    store.undo(); // the model change
    store.undo(); // the pixel
    expect(rig.lastUploadBytes).toBe(4);
    expect(onUpdated).toHaveBeenCalledOnce();
  });

  it('a row with several edits uploads one range from the first to the last change', () => {
    const rig = rigFor('classic');
    rig.texture.onUpdate?.(rig.texture);
    const skin = blankDocument().pixels;
    const edited = { ...skin, data: new Uint8ClampedArray(skin.data) };
    edited.data.set([255, 0, 0, 255], (5 * 64 + 10) * 4);
    edited.data.set([255, 0, 0, 255], (5 * 64 + 20) * 4);
    edited.data.set([255, 0, 0, 255], (6 * 64 + 2) * 4);
    expect(rig.setSkin(edited)).toBe(true);
    expect(rig.texture.updateRanges).toEqual([
      { start: (5 * 64 + 10) * 4, count: 11 * 4 },
      { start: (6 * 64 + 2) * 4, count: 4 },
    ]);
    rig.texture.clearUpdateRanges();
    expect(rig.setSkin(edited)).toBe(false); // nothing changed
  });

  it('disconnecting stops updates (no work after the view unmounts)', () => {
    const store = new DocumentStore(blankDocument());
    const rig = rigFor('classic');
    const disconnect = connectSkinSource(rig, storeSource(store));
    disconnect();
    paint(store, 9, 10, RED);
    expect(colorOnBody(rig, 'classic', 9, 10).a).toBe(0);
  });

  it('covers every body part with at least one marker', () => {
    const parts = new Set(
      MARKERS.map(([, x, y]) => regionAt(x, y, 'classic')?.part).filter((p) => p !== undefined),
    );
    expect([...parts].sort()).toEqual([...BODY_PARTS].sort());
  });
});
