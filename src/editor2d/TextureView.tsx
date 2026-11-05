import { useEffect, useMemo, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import {
  SKIN_HEIGHT,
  SKIN_WIDTH,
  allFaceRegions,
  regionAt,
  type BodyPart,
  type PixelBuffer,
  type SkinModel,
} from '@/engine';
import { isDimmed, moveTexel, screenToTexel, visiblePixels, type Texel } from './texture-view-math';

export interface TextureViewProps {
  readonly skin: PixelBuffer;
  readonly model: SkinModel;
  /** CSS pixels per texel. */
  readonly zoom: number;
  readonly showInner: boolean;
  readonly showOuter: boolean;
  readonly grid: boolean;
  readonly outlines: boolean;
  readonly focus: BodyPart | 'all';
  /** Highlight color (the user's accent). */
  readonly accent: string;
  readonly inspected: Texel | null;
  readonly onInspect: (texel: Texel | null) => void;
  readonly label: string;
}

const CHECKER_A = '#2b3036';
const CHECKER_B = '#363c44';
const DIM = 'rgba(8, 10, 12, 0.6)';

/**
 * Read-only, pixel-exact view of the 64×64 skin texture: transparency
 * checkerboard, optional pixel grid, face outlines from the engine region
 * tables, focus dimming and texel inspection (pointer or arrow keys).
 * Drawing tools are added in later milestones; this view never modifies pixels.
 */
export function TextureView({
  skin,
  model,
  zoom,
  showInner,
  showOuter,
  grid,
  outlines,
  focus,
  accent,
  inspected,
  onInspect,
  label,
}: TextureViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textureRef = useRef<HTMLCanvasElement | null>(null);
  const size = SKIN_WIDTH * zoom;

  const pixels = useMemo(
    () => visiblePixels(skin, { model, showInner, showOuter }),
    [skin, model, showInner, showOuter],
  );
  const dimmed = useMemo(() => {
    const mask: Texel[] = [];
    for (let y = 0; y < SKIN_HEIGHT; y++) {
      for (let x = 0; x < SKIN_WIDTH; x++) if (isDimmed(x, y, model, focus)) mask.push({ x, y });
    }
    return mask;
  }, [model, focus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    // Transparency checkerboard, one check per texel.
    ctx.fillStyle = CHECKER_A;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = CHECKER_B;
    for (let y = 0; y < SKIN_HEIGHT; y++) {
      for (let x = y % 2; x < SKIN_WIDTH; x += 2) ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
    }

    // Texture.
    textureRef.current ??= document.createElement('canvas');
    const texture = textureRef.current;
    texture.width = SKIN_WIDTH;
    texture.height = SKIN_HEIGHT;
    texture
      .getContext('2d')
      ?.putImageData(new ImageData(new Uint8ClampedArray(pixels), SKIN_WIDTH, SKIN_HEIGHT), 0, 0);
    ctx.drawImage(texture, 0, 0, size, size);

    // Unused areas and parts outside the focus.
    ctx.fillStyle = DIM;
    for (const { x, y } of dimmed) ctx.fillRect(x * zoom, y * zoom, zoom, zoom);

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
      for (const { rect, layer, part } of allFaceRegions(model)) {
        if (focus !== 'all' && part !== focus) continue;
        ctx.strokeStyle = layer === 'inner' ? 'rgba(255, 255, 255, 0.35)' : `${accent}99`;
        ctx.strokeRect(
          rect.x * zoom + 0.5,
          rect.y * zoom + 0.5,
          rect.w * zoom - 1,
          rect.h * zoom - 1,
        );
      }
    }

    if (inspected) {
      const region = regionAt(inspected.x, inspected.y, model);
      ctx.strokeStyle = accent;
      if (region) {
        ctx.lineWidth = 2;
        const r = region.rect;
        ctx.strokeRect(r.x * zoom + 1, r.y * zoom + 1, r.w * zoom - 2, r.h * zoom - 2);
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(inspected.x * zoom + 1, inspected.y * zoom + 1, zoom - 2, zoom - 2);
    }
  }, [pixels, dimmed, size, zoom, grid, outlines, focus, model, accent, inspected]);

  const onPointer = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onInspect(screenToTexel(event.clientX - rect.left, event.clientY - rect.top, zoom));
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
      onInspect(null);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointer}
      onPointerDown={onPointer}
      onPointerLeave={() => {
        onInspect(null);
      }}
      onKeyDown={onKeyDown}
      className="block shrink-0 cursor-crosshair rounded-sm outline-offset-4"
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
    />
  );
}
