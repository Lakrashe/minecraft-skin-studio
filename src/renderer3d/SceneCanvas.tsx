import { Canvas } from '@react-three/fiber';
import type { ReactNode } from 'react';
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
  /** `demand` renders only on invalidation — use for static previews to save battery. */
  readonly frameloop?: 'always' | 'demand';
  readonly className?: string;
  /** Accessible description of what the 3D view shows. */
  readonly label: string;
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
}: SceneCanvasProps) {
  if (!isWebGLAvailable()) return <>{fallback}</>;
  return (
    <RenderErrorBoundary fallback={fallback}>
      <div className={className} role="img" aria-label={label}>
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
    </RenderErrorBoundary>
  );
}
