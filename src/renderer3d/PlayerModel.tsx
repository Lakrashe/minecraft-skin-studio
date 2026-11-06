import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { BodyPart, PixelBuffer, SkinModel } from '@/engine';
import { sampleAnimation, type AnimationId } from '@/rig';
import {
  connectSkinSource,
  isSkinSource,
  PlayerRig,
  staticSkinSource,
  type SkinSource,
} from './core';

export interface PlayerModelProps {
  /**
   * The skin: a fixed texture, or a live `SkinSource` (the editor's document).
   * A live source updates the texture directly — pixel edits do not re-render
   * this component or the scene.
   */
  readonly skin: PixelBuffer | SkinSource;
  readonly model: SkinModel;
  readonly showInner?: boolean;
  readonly showOuter?: boolean;
  /** Parts to draw; all when omitted. */
  readonly visibleParts?: ReadonlySet<BodyPart>;
  readonly animation?: AnimationId;
  readonly paused?: boolean;
  /** Ignore lights and show exact texture colors. */
  readonly unlit?: boolean;
}

/**
 * React binding for the rendering core's `PlayerRig`: one rig per model (Steve
 * or Alex), props applied to it, animation sampled every frame. Geometry, UV
 * mapping and material rules live in `core/` and are unit-tested there.
 */
export function PlayerModel({
  skin,
  model,
  showInner = true,
  showOuter = true,
  visibleParts,
  animation = 'idle',
  paused = false,
  unlit = false,
}: PlayerModelProps) {
  const rig = useMemo(() => new PlayerRig(model), [model]);
  useEffect(
    () => () => {
      rig.dispose();
    },
    [rig],
  );

  const invalidate = useThree((s) => s.invalidate);
  const source = useMemo(() => (isSkinSource(skin) ? skin : staticSkinSource(skin)), [skin]);
  // Layout effect: the texture is filled before the next frame is drawn. Each
  // later change copies only the changed rows and requests one frame.
  useLayoutEffect(
    () =>
      connectSkinSource(rig, source, () => {
        invalidate();
      }),
    [rig, source, invalidate],
  );
  useLayoutEffect(() => {
    rig.setVisibility({ showInner, showOuter, visibleParts });
  }, [rig, showInner, showOuter, visibleParts]);
  useLayoutEffect(() => {
    rig.setUnlit(unlit);
  }, [rig, unlit]);

  const time = useRef(0);
  useFrame((_, delta) => {
    if (!paused) time.current += Math.min(delta, 0.1);
    rig.setPose(sampleAnimation(animation, time.current));
  });

  return <primitive object={rig.root} />;
}
