import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  DataTexture,
  DoubleSide,
  FrontSide,
  MeshStandardMaterial,
  NearestFilter,
  RGBAFormat,
  SRGBColorSpace,
  type Group,
} from 'three';
import type { BodyPart, PixelBuffer, SkinModel } from '@/engine';
import { sampleAnimation, type AnimationId } from '@/rig';
import { partUvs, playerLayout } from './player-geometry';

export interface PlayerModelProps {
  readonly skin: PixelBuffer;
  readonly model: SkinModel;
  readonly showInner?: boolean;
  readonly showOuter?: boolean;
  /** Parts to draw; all when omitted. */
  readonly visibleParts?: ReadonlySet<BodyPart>;
  readonly animation?: AnimationId;
  readonly paused?: boolean;
}

function createSkinTexture(skin: PixelBuffer): DataTexture {
  const data = new Uint8Array(skin.data.buffer, skin.data.byteOffset, skin.data.byteLength);
  const texture = new DataTexture(data, skin.width, skin.height, RGBAFormat);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function partGeometry(
  size: readonly [number, number, number],
  inflate: number,
  uvs: Float32Array,
): BoxGeometry {
  const geometry = new BoxGeometry(
    size[0] + inflate * 2,
    size[1] + inflate * 2,
    size[2] + inflate * 2,
  );
  geometry.getAttribute('uv').array.set(uvs);
  geometry.getAttribute('uv').needsUpdate = true;
  return geometry;
}

/**
 * Minecraft player built from engine UV tables: six parts, each an inner box
 * plus a slightly larger outer-layer shell. The texture is the actual skin, so
 * transparent outer pixels are see-through and the base layer is opaque.
 */
export function PlayerModel({
  skin,
  model,
  showInner = true,
  showOuter = true,
  visibleParts,
  animation = 'idle',
  paused = false,
}: PlayerModelProps) {
  const texture = useMemo(() => createSkinTexture(skin), [skin]);
  useEffect(
    () => () => {
      texture.dispose();
    },
    [texture],
  );

  const materials = useMemo(
    () => ({
      // Base layer is opaque in game.
      inner: new MeshStandardMaterial({
        map: texture,
        roughness: 1,
        metalness: 0,
        side: FrontSide,
      }),
      // Outer layer: transparent pixels cut out, both sides visible like the game.
      outer: new MeshStandardMaterial({
        map: texture,
        roughness: 1,
        metalness: 0,
        transparent: true,
        alphaTest: 0.1,
        side: DoubleSide,
      }),
    }),
    [texture],
  );
  useEffect(
    () => () => {
      materials.inner.dispose();
      materials.outer.dispose();
    },
    [materials],
  );

  const parts = useMemo(
    () =>
      playerLayout(model).map((layout) => ({
        layout,
        inner: partGeometry(layout.size, 0, partUvs(layout.part, 'inner', model)),
        outer: partGeometry(layout.size, layout.outerInflate, partUvs(layout.part, 'outer', model)),
      })),
    [model],
  );
  useEffect(
    () => () => {
      for (const p of parts) {
        p.inner.dispose();
        p.outer.dispose();
      }
    },
    [parts],
  );

  const pivots = useRef<Partial<Record<BodyPart, Group | null>>>({});
  const time = useRef(0);

  useFrame((_, delta) => {
    if (!paused) time.current += Math.min(delta, 0.1);
    const pose = sampleAnimation(animation, time.current);
    for (const part of Object.keys(pivots.current) as BodyPart[]) {
      const group = pivots.current[part];
      const r = pose[part];
      group?.rotation.set(r.x, r.y, r.z);
    }
  });

  return (
    <group>
      {parts.map(({ layout, inner, outer }) => {
        if (visibleParts && !visibleParts.has(layout.part)) return null;
        return (
          <group
            key={layout.part}
            position={layout.pivot}
            ref={(group) => {
              pivots.current[layout.part] = group;
            }}
          >
            {showInner && (
              <mesh geometry={inner} material={materials.inner} position={layout.offset} />
            )}
            {showOuter && (
              <mesh
                geometry={outer}
                material={materials.outer}
                position={layout.offset}
                renderOrder={1}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}
