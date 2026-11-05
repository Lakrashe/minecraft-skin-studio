import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, type ReactNode } from 'react';
import type { Vector3 } from 'three';
import type { BodyPart, PixelBuffer, SkinModel } from '@/engine';
import type { AnimationId } from '@/rig';
import { cameraPosition, PLAYER_CENTER, type CameraView } from './camera-views';
import { PlayerModel } from './PlayerModel';
import SceneCanvas from './SceneCanvas';

export interface PlayerViewerProps {
  readonly skin: PixelBuffer;
  readonly model: SkinModel;
  readonly showInner?: boolean;
  readonly showOuter?: boolean;
  readonly visibleParts?: ReadonlySet<BodyPart>;
  readonly animation?: AnimationId;
  readonly paused?: boolean;
  readonly autoRotate?: boolean;
  /** `full`: rotate/zoom/pan; `rotate`: drag to rotate only (e.g. homepage hero). */
  readonly controls?: 'full' | 'rotate';
  /** Camera preset; change `viewRequest` to re-apply the same preset. */
  readonly view?: CameraView;
  readonly viewRequest?: number;
  readonly label: string;
  /** Shown when WebGL2 is unavailable or the renderer fails (caller supplies translated text). */
  readonly fallback: ReactNode;
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
  useEffect(() => {
    camera.position.set(...cameraPosition(view));
    camera.lookAt(...PLAYER_CENTER);
    if (controls) {
      controls.target.set(...PLAYER_CENTER);
      controls.update();
    }
  }, [camera, controls, view, request]);
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
  controls = 'full',
  view = 'reset',
  viewRequest = 0,
  label,
  fallback,
  className,
}: PlayerViewerProps) {
  return (
    <SceneCanvas label={label} fallback={fallback} className={className}>
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
    </SceneCanvas>
  );
}
