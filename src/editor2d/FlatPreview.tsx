import { useEffect, useMemo, useRef } from 'react';
import type { PixelBuffer, SkinModel } from '@/engine';
import { composeFlatView, FLAT_VIEW_HEIGHT, FLAT_VIEW_WIDTH, type FlatSide } from './flat-view';

export interface FlatPreviewProps {
  readonly skin: PixelBuffer;
  readonly model: SkinModel;
  readonly side?: FlatSide;
  /** Rendered height in CSS pixels; width follows the 1:2 aspect. */
  readonly height: number;
  /** Accessible description; omit for decorative thumbnails next to a visible name. */
  readonly label?: string;
  readonly className?: string;
}

/** Pixel-exact flat front/back view of a skin (cheap: no WebGL). */
export function FlatPreview({
  skin,
  model,
  side = 'front',
  height,
  label,
  className,
}: FlatPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const view = useMemo(() => composeFlatView(skin, model, side), [skin, model, side]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(
      new ImageData(new Uint8ClampedArray(view.data), view.width, view.height),
      0,
      0,
    );
  }, [view]);

  return (
    <canvas
      ref={canvasRef}
      width={FLAT_VIEW_WIDTH}
      height={FLAT_VIEW_HEIGHT}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      className={className}
      style={{ height, width: height / 2, imageRendering: 'pixelated' }}
    />
  );
}
