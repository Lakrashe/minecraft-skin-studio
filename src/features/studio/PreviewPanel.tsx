import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { sampleSkin } from '@/content';
import { FlatPreview } from '@/editor2d';
import { BODY_PARTS, type BodyPart } from '@/engine';
import { useT } from '@/i18n';
import { CAMERA_VIEWS, LazyPlayerViewer, type CameraView } from '@/renderer3d';
import { ANIMATIONS, type AnimationId } from '@/rig';
import { Button, IconButton, PixelLoader, SegmentedControl } from '@/ui';
import { useStudio } from './studio-store';

function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const onChange = () => {
      setActive(document.fullscreenElement === ref.current && ref.current !== null);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
    };
  }, [ref]);
  const supported = typeof document !== 'undefined' && document.fullscreenEnabled;
  const toggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void ref.current?.requestFullscreen();
  };
  return { active, supported, toggle };
}

/** Right panel: live 3D preview with camera and animation controls. */
export function PreviewPanel() {
  const t = useT();
  const s = useStudio();
  const panelRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(panelRef);
  const skin = sampleSkin(s.sampleId);
  const name = t(`samples.${s.sampleId}.name`);

  // Focusing one body part isolates it in 3D as well.
  const visibleParts = useMemo<ReadonlySet<BodyPart>>(
    () => new Set(s.focus === 'all' ? BODY_PARTS : [s.focus]),
    [s.focus],
  );

  const animationOptions = ANIMATIONS.map((id: AnimationId) => ({
    value: id,
    label: t(`studio.animations.${id}`),
  }));

  const fallback = (
    <div className="flex size-full flex-col items-center justify-center gap-4 p-4 text-center">
      <FlatPreview
        skin={skin}
        model={s.model}
        height={220}
        label={t('studio.previewLabel', { name })}
      />
      <p className="max-w-xs text-xs text-muted">{t('webgl.unavailable')}</p>
    </div>
  );

  return (
    <div ref={panelRef} className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <h2 className="text-sm font-medium text-muted">{t('studio.panels.preview')}</h2>
        {fullscreen.supported && (
          <IconButton
            icon={fullscreen.active ? 'minimize' : 'maximize'}
            size="sm"
            tooltipAlign="end"
            label={fullscreen.active ? t('studio.exitFullscreen') : t('studio.fullscreen')}
            onClick={fullscreen.toggle}
          />
        )}
      </div>

      <div className="relative min-h-[340px] flex-1 lg:min-h-56">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 80%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 60%)',
          }}
        />
        <Suspense
          fallback={
            <div className="flex size-full items-center justify-center">
              <PixelLoader />
            </div>
          }
        >
          <LazyPlayerViewer
            className="absolute inset-0"
            skin={skin}
            model={s.model}
            showInner={s.showInner}
            showOuter={s.showOuter}
            visibleParts={visibleParts}
            animation={s.animation}
            paused={s.paused}
            view={s.view}
            viewRequest={s.viewRequest}
            label={t('studio.previewLabel', { name })}
            fallback={fallback}
          />
        </Suspense>
      </div>

      <div className="flex flex-col gap-4 border-t border-line p-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold tracking-wider text-subtle uppercase">
            {t('studio.camera')}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CAMERA_VIEWS.map((view: CameraView) => (
              <Button
                key={view}
                size="sm"
                variant={view === 'reset' ? 'ghost' : 'secondary'}
                onClick={() => {
                  s.showView(view);
                }}
              >
                {t(`studio.views.${view}`)}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <SegmentedControl
              label={t('studio.animation')}
              value={s.animation}
              options={animationOptions}
              onChange={s.setAnimation}
            />
          </div>
          <IconButton
            icon={s.paused ? 'play' : 'pause'}
            label={s.paused ? t('studio.play') : t('studio.pause')}
            tooltipSide="top"
            tooltipAlign="end"
            disabled={s.animation === 'none'}
            onClick={s.togglePaused}
          />
        </div>
      </div>
    </div>
  );
}
