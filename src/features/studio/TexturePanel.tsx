import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import { fitZoom, MAX_ZOOM, MIN_ZOOM, pinchZoom, TextureView } from '@/editor2d';
import type { FaceRegion } from '@/engine';
import { useT } from '@/i18n';
import { useSettings } from '@/state';
import { IconButton } from '@/ui';
import { useStudioDocument } from './document';
import { useEditMask, useStrokeHandlers } from './editing';
import { isTypingTarget } from './shortcuts';
import { setGesture } from './stroke-controller';
import { useStudio, type ToolId } from './studio-store';
import { ToolButtons } from './ToolsPanel';

const CURSORS: Readonly<Record<ToolId, string>> = {
  pencil: 'crosshair',
  eraser: 'cell',
  bucket: 'crosshair',
  eyedropper: 'copy',
  line: 'crosshair',
  rect: 'crosshair',
  pan: 'grab',
};

/** Where the zoom should stay anchored: a texel position under a screen point. */
interface ZoomAnchor {
  readonly texelX: number;
  readonly texelY: number;
  readonly clientX: number;
  readonly clientY: number;
}

/** Center workspace: the editable 64×64 texture, zoom and pan. */
export function TexturePanel() {
  const t = useT();
  const s = useStudio(
    useShallow((st) => ({
      zoom: st.zoom,
      tool: st.tool,
      mirror: st.mirror,
      showInner: st.showInner,
      showOuter: st.showOuter,
      grid: st.grid,
      outlines: st.outlines,
      labels: st.labels,
      inspected: st.inspected,
      fitRequest: st.fitRequest,
      setInspected: st.setInspected,
      setZoom: st.setZoom,
      zoomTo: st.zoomTo,
      requestFit: st.requestFit,
    })),
  );
  const { texture, document } = useStudioDocument();
  const accent = useSettings((st) => st.accent);
  const mask = useEditMask();
  const strokes = useStrokeHandlers();
  // Label candidates per face, longest first: "Head · Front", then "Front".
  const faceLabels = useCallback(
    ({ part, layer, face }: FaceRegion): readonly string[] => {
      const name = layer === 'inner' ? t(`studio.parts.${part}`) : t(`studio.outerParts.${part}`);
      const faceName = t(`studio.status.faces.${face}`);
      return layer === 'inner'
        ? [`${name} · ${faceName}`, faceName]
        : [`${name} · ${faceName}`, name, faceName];
    },
    [t],
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const anchor = useRef<ZoomAnchor | null>(null);
  const pan = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  /** Touch points currently down in the workspace. */
  const touches = useRef(new Map<number, { x: number; y: number }>());
  /** Two-finger pinch: finger distance and zoom at the start, last midpoint. */
  const pinch = useRef<{ distance: number; zoom: number; mid: { x: number; y: number } } | null>(
    null,
  );
  const [spaceHeld, setSpaceHeld] = useState(false);
  const panning = spaceHeld || s.tool === 'pan';
  const storeSetZoom = s.setZoom;
  const zoomTo = s.zoomTo;

  const fitNow = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    storeSetZoom(fitZoom(el.clientWidth, el.clientHeight));
  }, [storeSetZoom]);

  /** A manual zoom (stops auto-fitting), anchored at a screen point or the center. */
  const setZoom = useCallback(
    (zoom: number, at?: { clientX: number; clientY: number }) => {
      const canvas = scrollRef.current?.querySelector('canvas');
      const current = useStudio.getState().zoom;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const clientX = at?.clientX ?? rect.left + rect.width / 2;
        const clientY = at?.clientY ?? rect.top + rect.height / 2;
        anchor.current = {
          texelX: (clientX - rect.left) / current,
          texelY: (clientY - rect.top) / current,
          clientX,
          clientY,
        };
      }
      zoomTo(zoom);
    },
    [zoomTo],
  );

  // "Fit to view" (button or shortcut) fits now and keeps fitting on resize.
  useEffect(() => {
    if (s.fitRequest > 0) fitNow();
  }, [s.fitRequest, fitNow]);

  // After a zoom, scroll so the anchored texel stays under the same screen point.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const a = anchor.current;
    anchor.current = null;
    const canvas = el?.querySelector('canvas');
    if (!el || !a || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    el.scrollLeft += rect.left + a.texelX * s.zoom - a.clientX;
    el.scrollTop += rect.top + a.texelY * s.zoom - a.clientY;
  }, [s.zoom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (useStudio.getState().autoFit) fitNow();
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [fitNow]);

  // Ctrl/⌘ + wheel zooms at the pointer. React's wheel listener is passive and
  // cannot cancel the browser's page zoom, so a native listener is used.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      if (event.deltaY === 0) return;
      setZoom(useStudio.getState().zoom + (event.deltaY < 0 ? 1 : -1), event);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [setZoom]);

  // Hold Space to pan — only for the workspace: when focus is in it (the
  // texture), or nothing is focused and the pointer is over it. Buttons,
  // switches, fields and dialogs keep their own Space behavior.
  const hovering = useRef(false);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.defaultPrevented || isTypingTarget(event.target)) return;
      if (window.document.querySelector('dialog[open]')) return;
      const target = event.target;
      const inWorkspace = target instanceof Node && scrollRef.current?.contains(target) === true;
      const nothingFocused =
        target === window.document.body || target === window.document.documentElement;
      if (!inWorkspace && !(nothingFocused && hovering.current)) return;
      event.preventDefault();
      setSpaceHeld(true);
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpaceHeld(false);
    };
    const blur = () => {
      setSpaceHeld(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  // Pan: middle mouse button anywhere, or primary button in pan mode.
  const onPanStart = (event: PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || !(event.button === 1 || (event.button === 0 && panning))) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pan.current = { x: event.clientX, y: event.clientY, left: el.scrollLeft, top: el.scrollTop };
  };
  const onPanMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const p = pan.current;
    if (!el || !p) return;
    el.scrollLeft = p.left - (event.clientX - p.x);
    el.scrollTop = p.top - (event.clientY - p.y);
  };
  const onPanEnd = () => {
    pan.current = null;
  };

  // Two fingers: pinch to zoom (anchored between the fingers) and move to pan.
  const fingers = () => {
    const [a, b] = [...touches.current.values()];
    if (!a || !b) return null;
    return {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      // A second finger anywhere in the workspace (texture or padding) makes
      // this a gesture: cancel the stroke the first finger started.
      if (touches.current.size >= 2) setGesture(true);
      const f = touches.current.size === 2 ? fingers() : null;
      if (f) {
        pan.current = null;
        pinch.current = { distance: f.distance, zoom: useStudio.getState().zoom, mid: f.mid };
        return;
      }
    }
    onPanStart(event);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (touches.current.has(event.pointerId)) {
      touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    const p = pinch.current;
    const f = p ? fingers() : null;
    const el = scrollRef.current;
    if (p && f && el) {
      el.scrollLeft -= f.mid.x - p.mid.x;
      el.scrollTop -= f.mid.y - p.mid.y;
      p.mid = f.mid;
      const zoom = pinchZoom(p.zoom, p.distance, f.distance);
      if (zoom !== useStudio.getState().zoom) setZoom(zoom, { clientX: f.mid.x, clientY: f.mid.y });
      return;
    }
    onPanMove(event);
  };
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    touches.current.delete(event.pointerId);
    if (touches.current.size < 2) pinch.current = null;
    // Drawing is allowed again only once every finger has lifted.
    if (touches.current.size === 0) setGesture(false);
    onPanEnd();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
        <h2 className="text-sm font-medium text-muted max-lg:sr-only">
          {t('studio.panels.texture')}
        </h2>
        {/* Phones and tablets: the tools panel is a separate tab, so keep the tools at hand. */}
        <div className="lg:hidden">
          <ToolButtons compact />
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            icon="zoomOut"
            size="sm"
            label={t('studio.zoomOut')}
            shortcut="−"
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
            shortcut="+"
            disabled={s.zoom >= MAX_ZOOM}
            onClick={() => {
              setZoom(s.zoom + 1);
            }}
          />
          <IconButton
            icon="fit"
            size="sm"
            label={t('studio.fit')}
            shortcut="0"
            tooltipAlign="end"
            onClick={s.requestFit}
          />
        </div>
      </div>
      <div
        ref={scrollRef}
        data-panning={panning || undefined}
        onPointerEnter={() => {
          hovering.current = true;
        }}
        onPointerLeave={() => {
          hovering.current = false;
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className="flex min-h-[320px] flex-1 touch-pan-x touch-pan-y overflow-auto bg-bg-raised p-4 data-[panning]:cursor-grab"
      >
        {/* m-auto centers when smaller than the viewport, scrolls when larger. */}
        <div className="m-auto">
          <TextureView
            skin={texture}
            model={document.model}
            zoom={s.zoom}
            showInner={s.showInner}
            showOuter={s.showOuter}
            grid={s.grid}
            outlines={s.outlines}
            editMask={mask}
            accent={accent}
            inspected={s.inspected}
            onInspect={s.setInspected}
            faceLabels={s.labels ? faceLabels : null}
            mirror={s.mirror}
            cursor={CURSORS[s.tool]}
            panning={panning}
            {...strokes}
            label={t('studio.textureLabel')}
          />
        </div>
      </div>
    </div>
  );
}
