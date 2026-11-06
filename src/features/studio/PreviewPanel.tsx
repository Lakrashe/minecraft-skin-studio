import {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import { FlatPreview } from '@/editor2d';
import { BODY_PARTS, type BodyPart } from '@/engine';
import { useT } from '@/i18n';
import {
  CAMERA_VIEWS,
  isWebGLAvailable,
  LazyPlayerViewer,
  LIGHTING_PRESETS,
  MAX_LIGHT_INTENSITY,
  MIN_LIGHT_INTENSITY,
  type CameraView,
  type LightingPreset,
} from '@/renderer3d';
import { ANIMATIONS, type AnimationId } from '@/rig';
import { useReducedMotion } from '@/state';
import {
  Button,
  IconButton,
  PixelLoader,
  SegmentedControl,
  Select,
  Slider,
  Switch,
  toast,
  useVisibility,
} from '@/ui';
import { studioSkinSource, useStudioDocument, useStudioModel } from './document';
import { effectiveAnimation, useStudio } from './studio-store';

function useFullscreen(ref: RefObject<HTMLElement | null>, onError: () => void) {
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
  // `fullscreenchange` stays the authority for `active`; a refused request
  // (permissions, policy, no user gesture) only produces a message.
  const toggle = () => {
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : ref.current?.requestFullscreen();
    request?.catch(onError);
  };
  return { active, supported, toggle };
}

/** The no-WebGL fallback: a flat view that follows edits (subscribes itself). */
function LiveFlatPreview(props: Omit<ComponentProps<typeof FlatPreview>, 'skin'>) {
  const { texture } = useStudioDocument();
  return <FlatPreview skin={texture} {...props} />;
}

/** Mounted only while the static fallback is shown; reports it to the panel. */
function StaticFallback({ onShow, children }: { onShow: () => void; children: ReactNode }) {
  useEffect(onShow, [onShow]);
  return <>{children}</>;
}

/** Right panel: live 3D preview with camera and animation controls. */
/**
 * Memoized (no props): re-renders only for its own subscriptions — model,
 * layers, camera, lighting — never because the page re-rendered.
 */
export const PreviewPanel = memo(function PreviewPanel() {
  const t = useT();
  const s = useStudio(
    useShallow((st) => ({
      showInner: st.showInner,
      showOuter: st.showOuter,
      focus: st.focus,
      animation: st.animation,
      paused: st.paused,
      turntable: st.turntable,
      lighting: st.lighting,
      lightIntensity: st.lightIntensity,
      view: st.view,
      viewRequest: st.viewRequest,
      setAnimation: st.setAnimation,
      togglePaused: st.togglePaused,
      setTurntable: st.setTurntable,
      setLighting: st.setLighting,
      setLightIntensity: st.setLightIntensity,
      showView: st.showView,
    })),
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Draw only while the preview is on screen (not on a hidden mobile tab).
  const { visible } = useVisibility(stageRef);
  const reducedMotion = useReducedMotion();
  const animation = effectiveAnimation(s.animation, reducedMotion);
  const fullscreen = useFullscreen(panelRef, () => {
    toast.warning(t('studio.fullscreenFailed'));
  });
  const [staticView, setStaticView] = useState(() => !isWebGLAvailable());
  const showStatic = useCallback(() => {
    setStaticView(true);
  }, []);
  // Only the model: pixel edits reach the 3D view through `studioSkinSource`
  // without re-rendering this panel.
  const model = useStudioModel();

  // Focusing one body part isolates it in 3D (and in the flat fallback).
  const visibleParts = useMemo<ReadonlySet<BodyPart>>(
    () => new Set(s.focus === 'all' ? BODY_PARTS : [s.focus]),
    [s.focus],
  );

  const lightingOptions = LIGHTING_PRESETS.map((id: LightingPreset) => ({
    value: id,
    label: t(`studio.lightingPresets.${id}`),
  }));

  const animationOptions = ANIMATIONS.map((id: AnimationId) => ({
    value: id,
    label: t(`studio.animations.${id}`),
  }));

  const fallback = (
    <StaticFallback onShow={showStatic}>
      <div className="flex size-full flex-col items-center justify-center gap-4 p-4 text-center">
        <LiveFlatPreview
          model={model}
          height={220}
          showInner={s.showInner}
          showOuter={s.showOuter}
          visibleParts={visibleParts}
          label={t('studio.flatPreviewLabel')}
        />
        <p className="max-w-xs text-xs text-muted">
          {t('webgl.unavailable')} {t('studio.flatPreviewNote')}
        </p>
      </div>
    </StaticFallback>
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

      <div ref={stageRef} className="relative min-h-[340px] flex-1 lg:min-h-56">
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
            skin={studioSkinSource}
            model={model}
            showInner={s.showInner}
            showOuter={s.showOuter}
            visibleParts={visibleParts}
            animation={animation}
            paused={s.paused}
            autoRotate={s.turntable}
            lighting={s.lighting}
            lightIntensity={s.lightIntensity}
            active={visible}
            view={s.view}
            viewRequest={s.viewRequest}
            label={t('studio.previewLabel')}
            fallback={fallback}
          />
        </Suspense>
      </div>

      {/* Camera and animation only apply to the 3D view, not the flat fallback. */}
      {!staticView && (
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
                value={animation}
                options={animationOptions}
                onChange={s.setAnimation}
              />
            </div>
            <IconButton
              icon={s.paused ? 'play' : 'pause'}
              label={s.paused ? t('studio.play') : t('studio.pause')}
              tooltipSide="top"
              tooltipAlign="end"
              disabled={animation === 'none'}
              onClick={s.togglePaused}
            />
          </div>
          <Switch
            label={t('studio.turntable')}
            description={t('studio.turntableHint')}
            checked={s.turntable}
            onChange={s.setTurntable}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Select
              label={t('studio.lighting')}
              value={s.lighting}
              options={lightingOptions}
              onChange={s.setLighting}
            />
            <Slider
              label={t('studio.lightIntensity')}
              min={MIN_LIGHT_INTENSITY * 100}
              max={MAX_LIGHT_INTENSITY * 100}
              step={5}
              value={Math.round(s.lightIntensity * 100)}
              disabled={s.lighting === 'flat'}
              formatValue={(v) => `${String(v)}%`}
              onChange={(v) => {
                s.setLightIntensity(v / 100);
              }}
            />
          </div>
          {s.lighting === 'flat' && (
            <p className="text-xs text-muted">{t('studio.lightingFlatHint')}</p>
          )}
        </div>
      )}
    </div>
  );
});
