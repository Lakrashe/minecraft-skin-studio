import { useEffect, useMemo, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import {
  SKIN_HEIGHT,
  SKIN_WIDTH,
  allFaceRegions,
  mirrorPoint,
  regionAt,
  type FaceRegion,
  type PixelBuffer,
  type SkinMask,
  type SkinModel,
} from '@/engine';
import {
  fitLabel,
  labelFontSize,
  MIN_LABEL_ZOOM,
  moveTexel,
  screenToTexel,
  screenToTexelUnclamped,
  visiblePixels,
  type Texel,
} from './texture-view-math';

export interface TextureViewProps {
  /** The texture to show (the document plus any live stroke preview). */
  readonly skin: PixelBuffer;
  readonly model: SkinModel;
  /** CSS pixels per texel. */
  readonly zoom: number;
  readonly showInner: boolean;
  readonly showOuter: boolean;
  readonly grid: boolean;
  readonly outlines: boolean;
  /** Texels outside this mask are dimmed (not editable, or unused). */
  readonly editMask: SkinMask;
  /** Highlight color (the user's accent). */
  readonly accent: string;
  readonly inspected: Texel | null;
  readonly onInspect: (texel: Texel | null) => void;
  /**
   * Face labels: for each face, label candidates from longest to shortest
   * (the caller translates them). The longest that fits is drawn; nothing is
   * drawn below MIN_LABEL_ZOOM. Pass a stable (memoized) function.
   */
  readonly faceLabels?: ((region: FaceRegion) => readonly string[]) | null;
  /** Also highlight the inspected texel's mirror partner. */
  readonly mirror?: boolean;
  /** CSS cursor while hovering the texture. */
  readonly cursor?: string;
  /**
   * Primary-button strokes. Not started while `panning` is true, for other
   * buttons, or during multi-touch gestures, so the surrounding workspace can
   * pan and pinch-zoom instead. A second finger cancels the current stroke.
   */
  readonly panning?: boolean;
  readonly onStrokeStart?: (texel: Texel) => void;
  readonly onStrokeMove?: (texel: Texel) => void;
  readonly onStrokeEnd?: () => void;
  readonly onStrokeCancel?: () => void;
  /** Enter on the focused texture: apply the tool at the inspected texel. */
  readonly onActivate?: (texel: Texel) => void;
  readonly label: string;
}

/**
 * Sizes the backing store for `size` CSS pixels at the device pixel ratio
 * (capped at 2). Resizing clears a canvas, so it only happens on change.
 */
function prepareCanvas(canvas: HTMLCanvasElement, size: number): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const backing = Math.round(size * dpr);
  if (canvas.width !== backing) canvas.width = backing;
  if (canvas.height !== backing) canvas.height = backing;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

/** A 64×64 canvas holding one byte-per-texel image (for scaled drawing). */
function textureCanvas(bytes: Uint8ClampedArray): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = SKIN_WIDTH;
  canvas.height = SKIN_HEIGHT;
  canvas
    .getContext('2d')
    ?.putImageData(new ImageData(new Uint8ClampedArray(bytes), SKIN_WIDTH, SKIN_HEIGHT), 0, 0);
  return canvas;
}

/** Checkerboard (transparency, #2b3036/#363c44) and dim overlay (60 %) as 64×64 images, drawn scaled. */
function staticLayers(mask: SkinMask) {
  const checker = new Uint8ClampedArray(SKIN_WIDTH * SKIN_HEIGHT * 4);
  const dim = new Uint8ClampedArray(SKIN_WIDTH * SKIN_HEIGHT * 4);
  for (let i = 0; i < SKIN_WIDTH * SKIN_HEIGHT; i++) {
    const x = i % SKIN_WIDTH;
    const y = (i - x) / SKIN_WIDTH;
    const odd = (x + y) % 2 === 1;
    checker.set(odd ? [0x36, 0x3c, 0x44, 255] : [0x2b, 0x30, 0x36, 255], i * 4);
    if (mask.bits[i] !== 1) dim.set([8, 10, 12, 153], i * 4);
  }
  return { checker, dim };
}

/**
 * Pixel-exact view and drawing surface for the 64×64 skin texture:
 * transparency checkerboard, optional pixel grid, face outlines from the
 * engine region tables, dimming outside the editable area, and texel
 * inspection by pointer or arrow keys. It reports strokes in texture space;
 * the caller turns them into engine commands.
 */
export function TextureView({
  skin,
  model,
  zoom,
  showInner,
  showOuter,
  grid,
  outlines,
  editMask,
  accent,
  inspected,
  onInspect,
  faceLabels = null,
  mirror = false,
  cursor = 'crosshair',
  panning = false,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
  onStrokeCancel,
  onActivate,
  label,
}: TextureViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLCanvasElement>(null);
  const stroking = useRef(false);
  /** The pointer drawing the current stroke. */
  const strokePointer = useRef<number | null>(null);
  /** Pointers currently down on the canvas (to detect multi-touch gestures). */
  const pointers = useRef(new Set<number>());
  /** A multi-touch gesture (pinch) is in progress: no strokes until every finger lifts. */
  const gesture = useRef(false);
  const size = SKIN_WIDTH * zoom;

  const pixels = useMemo(
    () => visiblePixels(skin, { model, showInner, showOuter }),
    [skin, model, showInner, showOuter],
  );
  const layers = useMemo(() => {
    const { checker, dim } = staticLayers(editMask);
    return { checker: textureCanvas(checker), dim: textureCanvas(dim) };
  }, [editMask]);

  // Base layer: redrawn when the texture or view options change, never on inspection.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas ? prepareCanvas(canvas, size) : null;
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(layers.checker, 0, 0, size, size);
    ctx.drawImage(textureCanvas(pixels), 0, 0, size, size);
    ctx.drawImage(layers.dim, 0, 0, size, size);

    if (grid && zoom >= 4) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < SKIN_WIDTH; i++) {
        ctx.moveTo(i * zoom + 0.5, 0);
        ctx.lineTo(i * zoom + 0.5, size);
        ctx.moveTo(0, i * zoom + 0.5);
        ctx.lineTo(size, i * zoom + 0.5);
      }
      ctx.stroke();
    }

    if (outlines) {
      ctx.lineWidth = 1;
      for (const { rect, layer } of allFaceRegions(model)) {
        ctx.strokeStyle = layer === 'inner' ? 'rgba(255, 255, 255, 0.35)' : `${accent}99`;
        ctx.strokeRect(
          rect.x * zoom + 0.5,
          rect.y * zoom + 0.5,
          rect.w * zoom - 1,
          rect.h * zoom - 1,
        );
      }
    }
  }, [pixels, layers, size, zoom, grid, outlines, model, accent]);

  // Labels: their own layer, so strokes and inspection never redraw them.
  useEffect(() => {
    const canvas = labelsRef.current;
    const ctx = canvas ? prepareCanvas(canvas, size) : null;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, size, size);
    let drawn = 0;
    if (faceLabels && zoom >= MIN_LABEL_ZOOM) {
      const fontSize = labelFontSize(zoom);
      ctx.font = `600 ${String(fontSize)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      for (const region of allFaceRegions(model)) {
        if ((region.layer === 'inner' && !showInner) || (region.layer === 'outer' && !showOuter)) {
          continue;
        }
        const { rect } = region;
        const text = fitLabel(
          faceLabels(region),
          rect.w * zoom,
          rect.h * zoom,
          fontSize,
          (t) => ctx.measureText(t).width,
        );
        if (!text) continue;
        const cx = (rect.x + rect.w / 2) * zoom;
        const cy = (rect.y + rect.h / 2) * zoom;
        // Faces outside the editable area are labeled faintly, like their pixels.
        ctx.globalAlpha = editMask.bits[rect.y * SKIN_WIDTH + rect.x] === 1 ? 0.95 : 0.45;
        ctx.fillStyle = region.layer === 'inner' ? '#ffffff' : accent;
        ctx.strokeText(text, cx, cy);
        ctx.fillText(text, cx, cy);
        drawn++;
      }
      ctx.globalAlpha = 1;
    }
    canvas.dataset['labels'] = String(drawn);
  }, [faceLabels, model, zoom, size, showInner, showOuter, editMask, accent]);

  // Overlay: the inspected texel, its face and (with mirror drawing) its partner.
  useEffect(() => {
    const canvas = overlayRef.current;
    const ctx = canvas ? prepareCanvas(canvas, size) : null;
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    if (!inspected) return;
    const region = regionAt(inspected.x, inspected.y, model);
    if (region) {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      const r = region.rect;
      ctx.strokeRect(r.x * zoom + 1, r.y * zoom + 1, r.w * zoom - 2, r.h * zoom - 2);
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(inspected.x * zoom + 1, inspected.y * zoom + 1, zoom - 2, zoom - 2);
    const partner = mirror ? mirrorPoint(inspected.x, inspected.y, model) : null;
    if (partner) {
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(partner.x * zoom + 1, partner.y * zoom + 1, zoom - 2, zoom - 2);
      ctx.setLineDash([]);
    }
  }, [inspected, size, zoom, model, accent, mirror]);

  const local = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { px: event.clientX - rect.left, py: event.clientY - rect.top };
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    pointers.current.add(event.pointerId);
    // A second finger turns the touch into a gesture (pinch zoom, handled by
    // the workspace): drop the stroke the first finger started.
    if (pointers.current.size > 1) {
      gesture.current = true;
      endStroke(true);
      return;
    }
    const { px, py } = local(event);
    onInspect(screenToTexel(px, py, zoom));
    if (event.button !== 0 || panning || !onStrokeStart || gesture.current) return;
    const texel = screenToTexel(px, py, zoom);
    if (!texel) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    stroking.current = true;
    strokePointer.current = event.pointerId;
    onStrokeStart(texel);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const { px, py } = local(event);
    if (gesture.current) return;
    onInspect(screenToTexel(px, py, zoom));
    if (stroking.current && event.pointerId === strokePointer.current) {
      onStrokeMove?.(screenToTexelUnclamped(px, py, zoom));
    }
  };

  function endStroke(cancelled: boolean) {
    if (!stroking.current) return;
    stroking.current = false;
    strokePointer.current = null;
    if (cancelled) onStrokeCancel?.();
    else onStrokeEnd?.();
  }

  const onPointerEnd = (event: PointerEvent<HTMLCanvasElement>, cancelled: boolean) => {
    pointers.current.delete(event.pointerId);
    if (event.pointerId === strokePointer.current) endStroke(cancelled);
    if (pointers.current.size === 0) gesture.current = false;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const step = event.shiftKey ? 8 : 1;
    const moves: Readonly<Record<string, readonly [number, number]>> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      onInspect(moveTexel(inspected, move[0], move[1]));
    } else if (event.key === 'Escape') {
      if (stroking.current) endStroke(true);
      else onInspect(null);
    } else if (event.key === 'Enter' && inspected && onActivate) {
      event.preventDefault();
      onActivate(inspected);
    }
  };

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="img"
        aria-label={label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => {
          onPointerEnd(event, false);
        }}
        onPointerCancel={(event) => {
          onPointerEnd(event, true);
        }}
        onLostPointerCapture={(event) => {
          if (event.pointerId === strokePointer.current) endStroke(false);
        }}
        onPointerLeave={() => {
          if (!stroking.current) onInspect(null);
        }}
        onKeyDown={onKeyDown}
        className="block touch-none rounded-sm outline-offset-4"
        style={{
          width: size,
          height: size,
          imageRendering: 'pixelated',
          cursor: panning ? 'grab' : cursor,
        }}
      />
      <canvas
        ref={labelsRef}
        aria-hidden="true"
        data-testid="face-labels"
        className="pointer-events-none absolute inset-0"
        style={{ width: size, height: size }}
      />
      <canvas
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
