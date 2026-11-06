import { Canvas } from '@react-three/fiber';
import type { ReactNode } from 'react';
import type { FrameLoop } from './frame-loop';
import { RenderErrorBoundary } from './RenderErrorBoundary';
import { isWebGLAvailable } from './webgl';

/** Vertical center of the 32-unit-tall player model (docs/MINECRAFT_SKIN_FORMAT.md §9). */
const MODEL_CENTER_Y = 16;

export interface SceneCanvasProps {
  readonly children: ReactNode;
  /**
   * Shown instead of the canvas when WebGL2 is unavailable or the renderer fails
   * to start (caller supplies translated text).
   */
  readonly fallback: ReactNode;
  /** See `FrameLoop`; use `demand` for static content and `never` while hidden. */
  readonly frameloop?: FrameLoop;
  readonly className?: string | undefined;
  /** Accessible description of what the 3D view shows. */
  readonly label: string;
  /**
   * Controls layered over the canvas (e.g. a pause button). Rendered only while
   * the 3D view itself is shown, never with the fallback.
   */
  readonly overlay?: ReactNode;
}

/**
 * Shared React Three Fiber canvas with project defaults:
 * - capped device pixel ratio for performance,
 * - transparent background so pages control the backdrop,
 * - fixed camera suited to a 32-unit-tall player model (docs/MINECRAFT_SKIN_FORMAT.md §9).
 *
 * Import through `LazySceneCanvas` (index.ts) so Three.js loads only when needed.
 */
export default function SceneCanvas({
  children,
  fallback,
  frameloop = 'always',
  className,
  label,
  overlay,
}: SceneCanvasProps) {
  if (!isWebGLAvailable()) return <>{fallback}</>;
  return (
    <RenderErrorBoundary fallback={fallback}>
      <div className={className}>
        <div role="img" aria-label={label} className="size-full" data-frameloop={frameloop}>
          <Canvas
            frameloop={frameloop}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            camera={{ position: [0, MODEL_CENTER_Y, 60], fov: 35, near: 0.1, far: 1000 }}
            onCreated={({ camera }) => {
              camera.lookAt(0, MODEL_CENTER_Y, 0);
            }}
          >
            {children}
          </Canvas>
        </div>
        {overlay}
      </div>
    </RenderErrorBoundary>
  );
}
