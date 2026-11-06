import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { Vector3 } from 'three';
import type { BodyPart, PixelBuffer, SkinModel } from '@/engine';
import type { AnimationId } from '@/rig';
import {
  cameraPosition,
  DEFAULT_LIGHTING,
  lightingRig,
  PLAYER_CENTER,
  viewerFrameLoop,
  type CameraView,
  type LightingPreset,
  type LightingRig,
} from './core';
import { PlayerModel } from './PlayerModel';
import SceneCanvas from './SceneCanvas';

export interface PlayerViewerProps {
  readonly skin: PixelBuffer;
  readonly model: SkinModel;
  readonly showInner?: boolean;
  readonly showOuter?: boolean;
  readonly visibleParts?: ReadonlySet<BodyPart>;
  /**
   * Animation to play. Motion policy is the caller's (reduced-motion
   * preferences live outside the renderer): pass `none` for a still pose.
   */
  readonly animation?: AnimationId;
  readonly paused?: boolean;
  readonly autoRotate?: boolean;
  /** Lighting preset (`flat` = unlit, exact texture colors). Defaults to `studio`. */
  readonly lighting?: LightingPreset;
  /** Multiplies every light's intensity (clamped to 0.25–2). */
  readonly lightIntensity?: number;
  /**
   * False while the view is offscreen or hidden: nothing is drawn until it
   * becomes active again. Defaults to true.
   */
  readonly active?: boolean;
  /** `full`: rotate/zoom/pan; `rotate`: drag to rotate only (e.g. homepage hero). */
  readonly controls?: 'full' | 'rotate';
  /** Camera preset; change `viewRequest` to re-apply the same preset. */
  readonly view?: CameraView;
  readonly viewRequest?: number;
  readonly label: string;
  /** Shown when WebGL2 is unavailable or the renderer fails (caller supplies translated text). */
  readonly fallback: ReactNode;
  /** Controls layered over the 3D view; not shown with the fallback. */
  readonly overlay?: ReactNode;
  readonly className?: string;
}

/** The part of Drei's OrbitControls we use (avoids importing the transitive three-stdlib). */
interface OrbitLike {
  readonly target: Vector3;
  update(): void;
}

/**
 * Moves the camera to a preset when `view` or `request` changes. A new
 * controls instance (see the OrbitControls `key` below) must not snap the
 * camera back to the preset, so each request is applied once — again only if
 * it was first applied before the controls existed.
 */
function CameraPreset({ view, request }: { view: CameraView; request: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null;
  const invalidate = useThree((s) => s.invalidate);
  const applied = useRef<string | null>(null);
  useEffect(() => {
    const key = `${view}:${String(request)}:${controls ? 'controls' : 'none'}`;
    if (applied.current === key) return;
    applied.current = key;
    camera.position.set(...cameraPosition(view));
    camera.lookAt(...PLAYER_CENTER);
    if (controls) {
      controls.target.set(...PLAYER_CENTER);
      controls.update();
    }
    invalidate();
  }, [camera, controls, view, request, invalidate]);
  return null;
}

interface PictureInputs {
  readonly frameloop: string;
  readonly skin: PixelBuffer;
  readonly model: SkinModel;
  readonly showInner: boolean;
  readonly showOuter: boolean;
  readonly visibleParts: ReadonlySet<BodyPart> | undefined;
  readonly animation: AnimationId;
  readonly paused: boolean;
  readonly lights: LightingRig;
}

/**
 * In `demand` mode, draws again whenever an input to the picture changes. Two
 * frames: the pose is applied inside useFrame during the first.
 */
function RenderOnChange(p: PictureInputs) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate(2);
  }, [
    invalidate,
    p.frameloop,
    p.skin,
    p.model,
    p.showInner,
    p.showOuter,
    p.visibleParts,
    p.animation,
    p.paused,
    p.lights,
  ]);
  return null;
}

/** Three.js lights for a lighting rig (pure data from `core/lighting`). */
function Lights({ rig }: { rig: LightingRig }) {
  return (
    <>
      {rig.lights.map((light, i) => {
        switch (light.kind) {
          case 'ambient':
            return <ambientLight key={i} color={light.color} intensity={light.intensity} />;
          case 'hemisphere':
            return (
              <hemisphereLight
                key={i}
                color={light.color}
                groundColor={light.groundColor}
                intensity={light.intensity}
              />
            );
          case 'directional':
            return (
              <directionalLight
                key={i}
                color={light.color}
                intensity={light.intensity}
                position={light.position}
              />
            );
        }
      })}
    </>
  );
}

/** Interactive 3D player preview. Load via `LazyPlayerViewer` (index.ts). */
export default function PlayerViewer({
  skin,
  model,
  showInner = true,
  showOuter = true,
  visibleParts,
  animation = 'idle',
  paused = false,
  autoRotate = false,
  lighting = DEFAULT_LIGHTING,
  lightIntensity = 1,
  active = true,
  controls = 'full',
  view = 'reset',
  viewRequest = 0,
  label,
  fallback,
  overlay,
  className,
}: PlayerViewerProps) {
  const frameloop = viewerFrameLoop({ active, autoRotate, animation, paused });
  const lights = useMemo(() => lightingRig(lighting, lightIntensity), [lighting, lightIntensity]);
  return (
    <SceneCanvas
      label={label}
      fallback={fallback}
      className={className}
      frameloop={frameloop}
      overlay={overlay}
    >
      <Lights rig={lights} />
      <PlayerModel
        skin={skin}
        model={model}
        showInner={showInner}
        showOuter={showOuter}
        {...(visibleParts ? { visibleParts } : {})}
        animation={animation}
        paused={paused}
        unlit={lights.unlit}
      />
      {/*
        Damping keeps auto-rotation's momentum for ~100 frames after it stops
        (seconds on slow devices). Remounting the controls when auto-rotation
        turns off drops that momentum, so pausing stops at once.
      */}
      <OrbitControls
        key={autoRotate ? 'auto-rotate' : 'manual'}
        makeDefault
        target={PLAYER_CENTER}
        enablePan={controls === 'full'}
        enableZoom={controls === 'full'}
        enableDamping
        minDistance={24}
        maxDistance={130}
        autoRotate={autoRotate}
        autoRotateSpeed={1.1}
      />
      <CameraPreset view={view} request={viewRequest} />
      <RenderOnChange
        frameloop={frameloop}
        skin={skin}
        model={model}
        showInner={showInner}
        showOuter={showOuter}
        visibleParts={visibleParts}
        animation={animation}
        paused={paused}
        lights={lights}
      />
    </SceneCanvas>
  );
}
