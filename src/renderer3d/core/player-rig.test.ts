/**
 * Geometry and UV mapping of the real Three.js player meshes (built in Node,
 * no WebGL). Expectations come from Minecraft's model and texture conventions,
 * written out independently of the mapping code:
 *
 * - Sizes and joints follow Java Edition (docs/MINECRAFT_SKIN_FORMAT.md §9).
 * - Every box face samples exactly its region of the 64×64 skin
 *   (engine `faceRect`), oriented as seen from outside the model:
 *   side faces upright, the texture's left edge on the viewer's left;
 *   top and bottom faces with the player's right side (−x) on the texture's
 *   left and the back (−z) on its top row.
 */
import {
  Box3,
  DoubleSide,
  FrontSide,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NearestFilter,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { describe, expect, it } from 'vitest';
import {
  BODY_PARTS,
  FACES,
  SKIN_MODELS,
  createPixelBuffer,
  faceRect,
  setPixel,
  type Face,
  type SkinModel,
} from '@/engine';
import { NEUTRAL_POSE } from '@/rig';
import { BOX_FACE_ORDER } from './player-geometry';
import { OUTER_ALPHA_CUTOFF, PlayerRig } from './player-rig';

type V3 = readonly [number, number, number];

/** Outward normal, and the viewer's right/up directions when looking at the face from outside. */
const FACE_FRAME: Readonly<Record<Face, { normal: V3; right: V3; up: V3 }>> = {
  front: { normal: [0, 0, 1], right: [1, 0, 0], up: [0, 1, 0] },
  back: { normal: [0, 0, -1], right: [-1, 0, 0], up: [0, 1, 0] },
  left: { normal: [1, 0, 0], right: [0, 0, -1], up: [0, 1, 0] }, // player's left side
  right: { normal: [-1, 0, 0], right: [0, 0, 1], up: [0, 1, 0] }, // player's right side
  top: { normal: [0, 1, 0], right: [1, 0, 0], up: [0, 0, -1] },
  bottom: { normal: [0, -1, 0], right: [1, 0, 0], up: [0, 0, -1] },
};

const dot = (v: Vector3, d: V3) => v.x * d[0] + v.y * d[1] + v.z * d[2];

function built(model: SkinModel) {
  const rig = new PlayerRig(model);
  rig.setPose(NEUTRAL_POSE);
  rig.root.updateMatrixWorld(true);
  return rig;
}

function bounds(rig: PlayerRig, part: string, layer: 'inner' | 'outer') {
  const entry = rig.meshes.find((m) => m.part === part && m.layer === layer);
  if (!entry) throw new Error(`missing ${part}:${layer}`);
  const box = new Box3().setFromObject(entry.mesh);
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return {
    x: [r(box.min.x), r(box.max.x)],
    y: [r(box.min.y), r(box.max.y)],
    z: [r(box.min.z), r(box.max.z)],
  };
}

describe('player geometry (Java Edition model)', () => {
  it('is 12 meshes: 6 parts × inner box and outer shell', () => {
    for (const model of SKIN_MODELS) {
      const rig = built(model);
      expect(rig.meshes).toHaveLength(12);
      for (const part of BODY_PARTS) {
        expect(rig.meshes.filter((m) => m.part === part).map((m) => m.layer)).toEqual([
          'inner',
          'outer',
        ]);
      }
    }
  });

  it('Steve (classic): head, body, 4-wide arms and legs in place', () => {
    const rig = built('classic');
    expect(bounds(rig, 'head', 'inner')).toEqual({ x: [-4, 4], y: [24, 32], z: [-4, 4] });
    expect(bounds(rig, 'body', 'inner')).toEqual({ x: [-4, 4], y: [12, 24], z: [-2, 2] });
    expect(bounds(rig, 'rightArm', 'inner')).toEqual({ x: [-8, -4], y: [12, 24], z: [-2, 2] });
    expect(bounds(rig, 'leftArm', 'inner')).toEqual({ x: [4, 8], y: [12, 24], z: [-2, 2] });
    // Hips at ±1.9: legs sit 0.1 inside the body outline and overlap at the center.
    expect(bounds(rig, 'rightLeg', 'inner')).toEqual({ x: [-3.9, 0.1], y: [0, 12], z: [-2, 2] });
    expect(bounds(rig, 'leftLeg', 'inner')).toEqual({ x: [-0.1, 3.9], y: [0, 12], z: [-2, 2] });
  });

  it('Alex (slim): 3-wide arms touching the body, half a pixel lower', () => {
    const rig = built('slim');
    expect(bounds(rig, 'rightArm', 'inner')).toEqual({
      x: [-7, -4],
      y: [11.5, 23.5],
      z: [-2, 2],
    });
    expect(bounds(rig, 'leftArm', 'inner')).toEqual({ x: [4, 7], y: [11.5, 23.5], z: [-2, 2] });
    expect(bounds(rig, 'head', 'inner')).toEqual({ x: [-4, 4], y: [24, 32], z: [-4, 4] });
  });

  it('outer shells are inflated 0.5 per side for the hat, 0.25 elsewhere', () => {
    const rig = built('classic');
    expect(bounds(rig, 'head', 'outer')).toEqual({
      x: [-4.5, 4.5],
      y: [23.5, 32.5],
      z: [-4.5, 4.5],
    });
    expect(bounds(rig, 'body', 'outer')).toEqual({
      x: [-4.25, 4.25],
      y: [11.75, 24.25],
      z: [-2.25, 2.25],
    });
    expect(bounds(rig, 'rightArm', 'outer')).toEqual({
      x: [-8.25, -3.75],
      y: [11.75, 24.25],
      z: [-2.25, 2.25],
    });
    expect(bounds(rig, 'rightLeg', 'outer')).toEqual({
      x: [-4.15, 0.35],
      y: [-0.25, 12.25],
      z: [-2.25, 2.25],
    });
  });

  it('parts rotate at their joints (neck, shoulders, hips)', () => {
    const rig = built('classic');
    expect(rig.pivot('head')?.position.toArray()).toEqual([0, 24, 0]);
    expect(rig.pivot('rightArm')?.position.toArray()).toEqual([-5, 22, 0]);
    expect(rig.pivot('leftLeg')?.position.toArray()).toEqual([1.9, 12, 0]);
    expect(built('slim').pivot('leftArm')?.position.toArray()).toEqual([5, 21.5, 0]);
    rig.setPose({ ...NEUTRAL_POSE, rightArm: { x: 0.5, y: 0, z: 0.25 } });
    expect(rig.pivot('rightArm')?.rotation.x).toBe(0.5);
    expect(rig.pivot('rightArm')?.rotation.z).toBe(0.25);
    expect(rig.pivot('leftArm')?.rotation.x).toBe(0);
  });
});

describe('UV mapping: every face shows its exact skin region, correctly oriented', () => {
  it.each(SKIN_MODELS)('%s: all 72 faces (6 parts × 2 layers × 6 faces)', (model) => {
    const rig = built(model);
    let faces = 0;
    for (const { part, layer, mesh } of rig.meshes) {
      const position = mesh.geometry.getAttribute('position');
      const uv = mesh.geometry.getAttribute('uv');
      BOX_FACE_ORDER.forEach((face, f) => {
        const frame = FACE_FRAME[face];
        const rect = faceRect(part, layer, face, model);
        const corners = [0, 1, 2, 3].map((i) => {
          const p = new Vector3().fromBufferAttribute(position, f * 4 + i);
          p.applyMatrix4(mesh.matrixWorld);
          return { p, u: uv.getX(f * 4 + i) * 64, v: uv.getY(f * 4 + i) * 64 };
        });
        // The face points the right way (e.g. "front" faces +z, the player's front).
        const center = corners.reduce((c, k) => c.add(k.p), new Vector3()).divideScalar(4);
        const meshCenter = new Box3().setFromObject(mesh).getCenter(new Vector3());
        expect(
          dot(center.clone().sub(meshCenter), frame.normal),
          `${part} ${layer} ${face}`,
        ).toBeGreaterThan(0);

        // Viewed from outside: left/right and top/bottom corners get the rect's corners.
        const minRight = Math.min(...corners.map((c) => dot(c.p, frame.right)));
        const maxUp = Math.max(...corners.map((c) => dot(c.p, frame.up)));
        for (const c of corners) {
          const isLeft = Math.abs(dot(c.p, frame.right) - minRight) < 1e-6;
          const isTop = Math.abs(dot(c.p, frame.up) - maxUp) < 1e-6;
          const where = `${model} ${part} ${layer} ${face} ${isTop ? 'top' : 'bottom'}-${isLeft ? 'left' : 'right'}`;
          expect(c.u, where).toBeCloseTo(isLeft ? rect.x : rect.x + rect.w, 6);
          expect(c.v, where).toBeCloseTo(isTop ? rect.y : rect.y + rect.h, 6);
        }
        faces++;
      });
    }
    expect(faces).toBe(72);
  });

  it('faces never sample outside the 64×64 texture', () => {
    for (const model of SKIN_MODELS) {
      for (const { mesh } of built(model).meshes) {
        const uv = mesh.geometry.getAttribute('uv');
        for (let i = 0; i < uv.count; i++) {
          expect(uv.getX(i)).toBeGreaterThanOrEqual(0);
          expect(uv.getX(i)).toBeLessThanOrEqual(1);
          expect(uv.getY(i)).toBeGreaterThanOrEqual(0);
          expect(uv.getY(i)).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('Steve and Alex arms use different texture widths; the rest is identical', () => {
    const arm = (model: SkinModel) => faceRect('rightArm', 'inner', 'front', model);
    expect(arm('classic')).toEqual({ x: 44, y: 20, w: 4, h: 12 });
    expect(arm('slim')).toEqual({ x: 44, y: 20, w: 3, h: 12 });
    for (const face of FACES) {
      expect(faceRect('head', 'outer', face, 'slim')).toEqual(
        faceRect('head', 'outer', face, 'classic'),
      );
    }
  });
});

describe('skin texture and transparency', () => {
  it('uses one pixel-exact texture: nearest filtering, no mipmaps, sRGB, row 0 at v = 0', () => {
    const rig = built('classic');
    const { texture } = rig;
    expect(texture.magFilter).toBe(NearestFilter);
    expect(texture.minFilter).toBe(NearestFilter);
    expect(texture.generateMipmaps).toBe(false);
    expect(texture.colorSpace).toBe(SRGBColorSpace);
    expect(texture.flipY).toBe(false);
    expect([texture.image.width, texture.image.height]).toEqual([64, 64]);
    for (const { mesh } of rig.meshes) {
      expect((mesh.material as MeshStandardMaterial).map).toBe(texture);
    }
  });

  it('setSkin copies the pixels (later changes to the source do not leak) and re-uploads', () => {
    const rig = built('classic');
    const skin = createPixelBuffer();
    setPixel(skin, 8, 8, { r: 10, g: 20, b: 30, a: 255 });
    const version = rig.texture.version;
    rig.setSkin(skin);
    expect(rig.texture.version).toBeGreaterThan(version);
    const data = rig.texture.image.data as Uint8Array;
    const i = (8 * 64 + 8) * 4;
    expect(Array.from(data.slice(i, i + 4))).toEqual([10, 20, 30, 255]);
    setPixel(skin, 8, 8, { r: 99, g: 99, b: 99, a: 255 });
    expect(data[i]).toBe(10);
    expect(() => {
      rig.setSkin(createPixelBuffer(64, 32));
    }).toThrow(RangeError);
  });

  it('inner layer is opaque (alpha ignored, as Java does); outer layer is see-through', () => {
    const rig = built('classic');
    for (const { layer, mesh } of rig.meshes) {
      const m = mesh.material;
      if (layer === 'inner') {
        expect(m.transparent).toBe(false);
        expect(m.alphaTest).toBe(0);
        expect(m.side).toBe(FrontSide);
      } else {
        expect(m.transparent).toBe(true);
        expect(m.alphaTest).toBe(OUTER_ALPHA_CUTOFF);
        expect(m.side).toBe(DoubleSide);
        expect(mesh.renderOrder).toBe(1);
      }
    }
  });

  it('unlit mode swaps to basic materials with the same rules, and back', () => {
    const rig = built('classic');
    rig.setUnlit(true);
    for (const { layer, mesh } of rig.meshes) {
      expect(mesh.material).toBeInstanceOf(MeshBasicMaterial);
      expect(mesh.material.transparent).toBe(layer === 'outer');
      // Exact colors: no tone mapping.
      expect(mesh.material.toneMapped).toBe(false);
    }
    rig.setUnlit(false);
    for (const { mesh } of rig.meshes) expect(mesh.material).toBeInstanceOf(MeshStandardMaterial);
  });

  it('shows and hides layers and body parts', () => {
    const rig = built('classic');
    rig.setVisibility({
      showInner: true,
      showOuter: false,
      visibleParts: new Set(['head'] as const),
    });
    const visible = rig.meshes.filter((m) => m.mesh.visible).map((m) => `${m.part}:${m.layer}`);
    expect(visible).toEqual(['head:inner']);
    rig.setVisibility({ showInner: true, showOuter: true });
    expect(rig.meshes.every((m) => m.mesh.visible)).toBe(true);
  });

  it('dispose releases everything without errors', () => {
    expect(() => {
      built('slim').dispose();
    }).not.toThrow();
  });
});
