/**
 * The Minecraft player as plain Three.js objects — no React, no DOM — so it can
 * be built and tested in Node and driven by any UI layer (ARCHITECTURE §6).
 *
 * Six parts, each an inner box and an inflated outer shell, hung from joint
 * pivots (`player-geometry.ts`). Every box face samples exactly its region of
 * the 64×64 skin (`boxUvs`), so this is never a generic textured cube.
 *
 * Transparency follows Java Edition:
 * - Inner layer: opaque. The game forces base-layer alpha to 255 when it
 *   loads a skin, so a transparent base pixel shows its RGB (often black).
 *   The material simply ignores alpha (no `transparent`, no `alphaTest`).
 * - Outer layer: see-through. Pixels below 10 % alpha are discarded, like the
 *   game's entity shaders; partial alpha blends. Drawn on both sides.
 */
import {
  BoxGeometry,
  DataTexture,
  DoubleSide,
  FrontSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NearestFilter,
  RGBAFormat,
  SRGBColorSpace,
  type Material,
} from 'three';
import {
  BODY_PARTS,
  SKIN_HEIGHT,
  SKIN_WIDTH,
  type BodyPart,
  type PixelBuffer,
  type SkinLayer,
  type SkinModel,
} from '@/engine';
import type { Pose } from '@/rig';
import { partUvs, playerLayout, type PartLayout } from './player-geometry';

/** Alpha below which outer-layer pixels are not drawn (the game uses 0.1). */
export const OUTER_ALPHA_CUTOFF = 0.1;

export interface RigVisibility {
  readonly showInner: boolean;
  readonly showOuter: boolean;
  /** Parts to draw; all when omitted. */
  readonly visibleParts?: ReadonlySet<BodyPart> | undefined;
}

export interface RigMesh {
  readonly part: BodyPart;
  readonly layer: SkinLayer;
  readonly mesh: Mesh<BoxGeometry, Material>;
}

/** A box sized for one part (plus inflation per side) with the part's UVs applied. */
export function partGeometry(layout: PartLayout, layer: SkinLayer, model: SkinModel): BoxGeometry {
  const inflate = layer === 'outer' ? layout.outerInflate : 0;
  const [w, h, d] = layout.size;
  const geometry = new BoxGeometry(w + inflate * 2, h + inflate * 2, d + inflate * 2);
  const uv = geometry.getAttribute('uv');
  uv.array.set(partUvs(layout.part, layer, model));
  uv.needsUpdate = true;
  return geometry;
}

function createSkinTexture(): DataTexture {
  const texture = new DataTexture(
    new Uint8Array(SKIN_WIDTH * SKIN_HEIGHT * 4),
    SKIN_WIDTH,
    SKIN_HEIGHT,
    RGBAFormat,
  );
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export class PlayerRig {
  readonly model: SkinModel;
  /** Add this to a scene. Feet at y = 0, 32 units tall, facing +z. */
  readonly root = new Group();
  readonly texture = createSkinTexture();
  private readonly pivots = new Map<BodyPart, Group>();
  private readonly meshList: RigMesh[] = [];
  private readonly materials: Readonly<Record<'lit' | 'unlit', Record<SkinLayer, Material>>>;
  private unlit = false;
  /** Whether the GPU holds the texture (set by Three.js after its first upload). */
  private uploaded = false;
  /** Bytes uploaded in the last `setSkin`, for tests and diagnostics. */
  private lastUpload = 0;

  constructor(model: SkinModel) {
    this.model = model;
    const inner = { map: this.texture, side: FrontSide } as const;
    const outer = {
      map: this.texture,
      side: DoubleSide,
      transparent: true,
      alphaTest: OUTER_ALPHA_CUTOFF,
    } as const;
    this.materials = {
      lit: {
        inner: new MeshStandardMaterial({ ...inner, roughness: 1, metalness: 0 }),
        outer: new MeshStandardMaterial({ ...outer, roughness: 1, metalness: 0 }),
      },
      // Unlit = exact texture colors, so no tone mapping either (React Three
      // Fiber turns filmic tone mapping on by default, which shifts colors).
      unlit: {
        inner: new MeshBasicMaterial({ ...inner, toneMapped: false }),
        outer: new MeshBasicMaterial({ ...outer, toneMapped: false }),
      },
    };
    // Three.js calls this after uploading the texture; from then on partial
    // (per-row) updates are safe.
    this.texture.onUpdate = () => {
      this.uploaded = true;
    };
    this.root.name = 'player';
    for (const layout of playerLayout(model)) {
      const pivot = new Group();
      pivot.name = layout.part;
      pivot.position.set(...layout.pivot);
      for (const layer of ['inner', 'outer'] as const) {
        const mesh = new Mesh<BoxGeometry, Material>(
          partGeometry(layout, layer, model),
          this.materials.lit[layer],
        );
        mesh.name = `${layout.part}:${layer}`;
        mesh.position.set(...layout.offset);
        // The outer shell is drawn after the inner box so its cut-outs show it.
        if (layer === 'outer') mesh.renderOrder = 1;
        pivot.add(mesh);
        this.meshList.push({ part: layout.part, layer, mesh });
      }
      this.pivots.set(layout.part, pivot);
      this.root.add(pivot);
    }
  }

  /** All twelve meshes (6 parts × inner/outer). */
  get meshes(): readonly RigMesh[] {
    return this.meshList;
  }

  pivot(part: BodyPart): Group | undefined {
    return this.pivots.get(part);
  }

  /**
   * Copies a 64×64 skin into the texture and schedules the GPU upload. Only
   * rows that changed are uploaded (per-row ranges spanning the changed
   * pixels), so a one-pixel edit uploads 4 bytes instead of 16 KB. Until the
   * texture has reached the GPU once, the whole texture is uploaded.
   * Returns whether anything changed (nothing to draw otherwise).
   */
  setSkin(skin: PixelBuffer): boolean {
    if (skin.width !== SKIN_WIDTH || skin.height !== SKIN_HEIGHT) {
      throw new RangeError(
        `Expected a 64×64 skin, got ${String(skin.width)}×${String(skin.height)}`,
      );
    }
    const target = this.texture.image.data as Uint8Array;
    const source = skin.data;
    const rowBytes = SKIN_WIDTH * 4;
    let uploaded = 0;
    if (!this.uploaded) {
      target.set(source);
      this.texture.clearUpdateRanges();
      uploaded = target.length;
    } else {
      for (let row = 0; row < SKIN_HEIGHT; row++) {
        const start = row * rowBytes;
        let first = -1;
        let last = -1;
        for (let i = start; i < start + rowBytes; i++) {
          if (target[i] !== source[i]) {
            if (first < 0) first = i;
            last = i;
          }
        }
        if (first < 0) continue;
        // Whole pixels: from the first changed pixel to the last one in the row.
        const from = first - (first % 4);
        const to = last - (last % 4) + 4;
        target.set(source.subarray(from, to), from);
        this.texture.addUpdateRange(from, to - from);
        uploaded += to - from;
      }
    }
    this.lastUpload = uploaded;
    if (uploaded === 0) return false;
    this.texture.needsUpdate = true;
    return true;
  }

  /**
   * The GPU copy of the texture is gone or untrusted (e.g. the WebGL context
   * was lost or restored): drop any pending partial ranges and upload the
   * whole current texture next time. Later edits use partial uploads again
   * once that full upload has happened.
   */
  invalidateGpuTexture(): void {
    this.uploaded = false;
    this.texture.clearUpdateRanges();
    this.texture.needsUpdate = true;
  }

  /** Bytes scheduled for upload by the last `setSkin` (0 when nothing changed). */
  get lastUploadBytes(): number {
    return this.lastUpload;
  }

  setVisibility({ showInner, showOuter, visibleParts }: RigVisibility): void {
    for (const { part, layer, mesh } of this.meshList) {
      const partVisible = !visibleParts || visibleParts.has(part);
      mesh.visible = partVisible && (layer === 'inner' ? showInner : showOuter);
    }
  }

  /** Unlit shows exact texture colors; lit responds to the scene's lights. */
  setUnlit(unlit: boolean): void {
    if (unlit === this.unlit) return;
    this.unlit = unlit;
    const set = this.materials[unlit ? 'unlit' : 'lit'];
    for (const { layer, mesh } of this.meshList) mesh.material = set[layer];
  }

  get isUnlit(): boolean {
    return this.unlit;
  }

  /** Rotates each part at its joint (radians). */
  setPose(pose: Pose): void {
    for (const part of BODY_PARTS) {
      const r = pose[part];
      this.pivots.get(part)?.rotation.set(r.x, r.y, r.z);
    }
  }

  /** Frees geometries, materials and the texture. */
  dispose(): void {
    for (const { mesh } of this.meshList) mesh.geometry.dispose();
    for (const set of Object.values(this.materials)) {
      set.inner.dispose();
      set.outer.dispose();
    }
    this.texture.dispose();
  }
}
