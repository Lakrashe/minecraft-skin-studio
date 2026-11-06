import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { BodyPart, PixelBuffer, SkinModel } from '@/engine';
import { sampleAnimation, type AnimationId } from '@/rig';
import { PlayerRig } from './core';

export interface PlayerModelProps {
  readonly skin: PixelBuffer;
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

  // Layout effects run before the next frame is drawn.
  useLayoutEffect(() => {
    rig.setSkin(skin);
  }, [rig, skin]);
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
