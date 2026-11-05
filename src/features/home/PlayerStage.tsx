import { Suspense } from 'react';
import { getSample, sampleSkin, type SampleId } from '@/content';
import { FlatPreview } from '@/editor2d';
import { LazyPlayerViewer } from '@/renderer3d';
import { cn } from '@/ui';

export interface PlayerStageProps {
  readonly sampleId: SampleId;
  readonly label: string;
  readonly autoRotate?: boolean;
  /** Mount the WebGL view; until then (or without WebGL) a flat preview is shown. */
  readonly active?: boolean;
  readonly fallbackHeight: number;
  readonly className?: string;
}

/**
 * A sample character in 3D, with a pixel-exact flat preview while Three.js
 * loads and as the fallback when WebGL2 is unavailable.
 */
export function PlayerStage({
  sampleId,
  label,
  autoRotate = true,
  active = true,
  fallbackHeight,
  className,
}: PlayerStageProps) {
  const sample = getSample(sampleId);
  const skin = sampleSkin(sampleId);
  const flat = (
    <div className="flex size-full items-center justify-center">
      <FlatPreview skin={skin} model={sample.model} height={fallbackHeight} label={label} />
    </div>
  );

  return (
    <div className={cn('relative', className)}>
      {active ? (
        <Suspense fallback={flat}>
          <LazyPlayerViewer
            className="size-full cursor-grab active:cursor-grabbing"
            skin={skin}
            model={sample.model}
            animation="idle"
            autoRotate={autoRotate}
            controls="rotate"
            view="reset"
            label={label}
            fallback={flat}
          />
        </Suspense>
      ) : (
        flat
      )}
    </div>
  );
}
