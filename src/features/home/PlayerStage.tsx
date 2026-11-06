import { Suspense, useRef, useState } from 'react';
import { getSample, sampleSkin, type SampleId } from '@/content';
import { FlatPreview } from '@/editor2d';
import { useT } from '@/i18n';
import { LazyPlayerViewer } from '@/renderer3d';
import { useReducedMotion } from '@/state';
import { cn, IconButton, useVisibility } from '@/ui';

export interface PlayerStageProps {
  readonly sampleId: SampleId;
  readonly label: string;
  readonly fallbackHeight: number;
  readonly className?: string;
}

/**
 * A sample character in 3D, with a pixel-exact flat preview while Three.js
 * loads and as the fallback when WebGL2 is unavailable.
 *
 * - The WebGL view mounts once the stage nears the viewport and draws only
 *   while it is on screen.
 * - It turns and idles unless the user asked for reduced motion (setting or
 *   OS preference), in which case it stands still; a pause button stops the
 *   motion on request.
 */
export function PlayerStage({ sampleId, label, fallbackHeight, className }: PlayerStageProps) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const { seen, visible } = useVisibility(ref, '200px');
  const reducedMotion = useReducedMotion();
  const [stopped, setStopped] = useState(false);
  const moving = !reducedMotion && !stopped;

  const sample = getSample(sampleId);
  const skin = sampleSkin(sampleId);
  const flat = (
    <div className="flex size-full items-center justify-center">
      <FlatPreview skin={skin} model={sample.model} height={fallbackHeight} label={label} />
    </div>
  );

  // Nothing moves under reduced motion, so there is nothing to pause.
  const pauseButton = reducedMotion ? null : (
    <div className="absolute top-2 right-2">
      <IconButton
        icon={stopped ? 'play' : 'pause'}
        size="sm"
        tooltipAlign="end"
        label={stopped ? t('home.playMotion') : t('home.pauseMotion')}
        className="bg-surface/70 backdrop-blur"
        onClick={() => {
          setStopped((s) => !s);
        }}
      />
    </div>
  );

  return (
    <div ref={ref} className={cn('relative', className)}>
      {seen ? (
        <Suspense fallback={flat}>
          <LazyPlayerViewer
            className="size-full cursor-grab active:cursor-grabbing"
            skin={skin}
            model={sample.model}
            animation={reducedMotion ? 'none' : 'idle'}
            paused={!moving}
            autoRotate={moving}
            active={visible}
            controls="rotate"
            view="reset"
            label={label}
            fallback={flat}
            overlay={pauseButton}
          />
        </Suspense>
      ) : (
        flat
      )}
    </div>
  );
}
