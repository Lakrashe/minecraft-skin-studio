import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, type ReactNode } from 'react';
import type { Vector3 } from 'three';
import type { BodyPart, PixelBuffer, SkinModel } from '@/engine';
import type { AnimationId } from '@/rig';
import { cameraPosition, PLAYER_CENTER, type CameraView } from './camera-views';
import { viewerFrameLoop } from './frame-loop';
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

function CameraPreset({ view, request }: { view: CameraView; request: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null;
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
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
  ]);
  return null;
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
  return (
    <SceneCanvas
      label={label}
      fallback={fallback}
      className={className}
      frameloop={frameloop}
      overlay={overlay}
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[30, 50, 40]} intensity={1.7} />
      <directionalLight position={[-35, 20, -40]} intensity={0.6} />
      <PlayerModel
        skin={skin}
        model={model}
        showInner={showInner}
        showOuter={showOuter}
        {...(visibleParts ? { visibleParts } : {})}
        animation={animation}
        paused={paused}
      />
      <OrbitControls
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
      />
    </SceneCanvas>
  );
}
