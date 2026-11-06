import { useCallback, useEffect, useRef } from 'react';
import { sampleSkin } from '@/content';
import { clampZoom, fitZoom, MAX_ZOOM, MIN_ZOOM, TextureView } from '@/editor2d';
import { useT } from '@/i18n';
import { useSettings } from '@/state';
import { IconButton } from '@/ui';
import { useStudio } from './studio-store';

/** Center workspace: the 64×64 texture with zoom controls. */
export function TexturePanel() {
  const t = useT();
  const s = useStudio();
  const accent = useSettings((st) => st.accent);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** While true, the texture keeps fitting the workspace (resize, rotation). */
  const autoFit = useRef(true);
  const name = t(`samples.${s.sampleId}.name`);
  const storeSetZoom = s.setZoom;

  const fitNow = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    storeSetZoom(fitZoom(el.clientWidth, el.clientHeight));
  }, [storeSetZoom]);

  /** A manual zoom stops auto-fitting until "Fit to view" is pressed. */
  const setZoom = useCallback(
    (zoom: number) => {
      autoFit.current = false;
      storeSetZoom(clampZoom(zoom));
    },
    [storeSetZoom],
  );
  const fit = () => {
    autoFit.current = true;
    fitNow();
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (autoFit.current) fitNow();
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [fitNow]);

  // Ctrl/⌘ + wheel zooms the texture instead of the page. React's wheel
  // listener is passive and cannot cancel the browser's zoom, so a native
  // non-passive listener is used; plain wheel scrolling is left alone.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      if (event.deltaY === 0) return;
      setZoom(useStudio.getState().zoom + (event.deltaY < 0 ? 1 : -1));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [setZoom]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <h2 className="text-sm font-medium text-muted">{t('studio.panels.texture')}</h2>
        <div className="flex items-center gap-1">
          <IconButton
            icon="zoomOut"
            size="sm"
            label={t('studio.zoomOut')}
            disabled={s.zoom <= MIN_ZOOM}
            onClick={() => {
              setZoom(s.zoom - 1);
            }}
          />
          <output className="w-10 text-center font-mono text-xs text-muted tabular-nums">
            {t('studio.zoomLevel', { zoom: s.zoom })}
          </output>
          <IconButton
            icon="zoomIn"
            size="sm"
            label={t('studio.zoomIn')}
            disabled={s.zoom >= MAX_ZOOM}
            onClick={() => {
              setZoom(s.zoom + 1);
            }}
          />
          <IconButton
            icon="fit"
            size="sm"
            label={t('studio.fit')}
            tooltipAlign="end"
            onClick={fit}
          />
        </div>
      </div>
      <div ref={scrollRef} className="flex min-h-[320px] flex-1 overflow-auto bg-bg-raised p-4">
        {/* m-auto centers when smaller than the viewport, scrolls when larger. */}
        <div className="m-auto">
          <TextureView
            skin={sampleSkin(s.sampleId)}
            model={s.model}
            zoom={s.zoom}
            showInner={s.showInner}
            showOuter={s.showOuter}
            grid={s.grid}
            outlines={s.outlines}
            focus={s.focus}
            accent={accent}
            inspected={s.inspected}
            onInspect={s.setInspected}
            label={t('studio.textureLabel', { name })}
          />
        </div>
      </div>
    </div>
  );
}
