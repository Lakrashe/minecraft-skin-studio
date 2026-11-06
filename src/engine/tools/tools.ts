/**
 * Drawing tools (ARCHITECTURE §4.3). A stroke turns pointer positions in
 * texture space into pixel changes; the caller previews `changes` while the
 * pointer moves and dispatches `finish()` once. Tools write only where the
 * edit mask allows; with mirror drawing on, every written texel is also
 * written at its mirror position.
 */
import { createPatch, type Command, type PixelChanges } from '../document/document';
import { regionAt, rectContains } from '../format/regions';
import type { SkinMask } from '../mask/mask';
import { getPixel, TRANSPARENT, type PixelBuffer } from '../model/pixel-buffer';
import { SKIN_WIDTH, type Rgba, type SkinModel } from '../model/types';
import { floodFillIndices, linePoints, rectPoints, type Point } from '../raster/shapes';
import { mirrorMap } from '../symmetry/mirror';

/** Tools that change pixels. The eyedropper only reads (see `pickColor`). */
export const DRAWING_TOOLS = ['pencil', 'eraser', 'bucket', 'line', 'rect'] as const;
export type DrawingTool = (typeof DRAWING_TOOLS)[number];

export interface ToolOptions {
  readonly color: Rgba;
  /** Where the tool may write (body part × editable skin layers). */
  readonly mask: SkinMask;
  readonly model: SkinModel;
  /** Also paint each texel's mirror (left ↔ right). */
  readonly mirror: boolean;
  /** Rectangle tool: fill instead of outline. */
  readonly filled?: boolean;
}

const inTexture = (p: Point) => p.x >= 0 && p.y >= 0 && p.x < SKIN_WIDTH && p.y < SKIN_WIDTH;

export class Stroke {
  readonly tool: DrawingTool;
  private readonly pixels: PixelBuffer;
  private readonly options: ToolOptions;
  private readonly start: Point;
  private readonly changeMap = new Map<number, Rgba>();
  private last: Point;
  private readonly color: Rgba;

  /** Starts a stroke at `start` on `pixels` (the document's texture). */
  constructor(tool: DrawingTool, pixels: PixelBuffer, options: ToolOptions, start: Point) {
    this.tool = tool;
    this.pixels = pixels;
    this.options = options;
    this.start = start;
    this.color = tool === 'eraser' ? TRANSPARENT : options.color;
    this.last = start;
    if (tool === 'bucket') this.fill();
    else this.plotAll([start]);
  }

  /** Pixel changes so far (texel index → color). */
  get changes(): PixelChanges {
    return this.changeMap;
  }

  /** Continues the stroke to `p` (pencil/eraser draw a connected line). */
  move(p: Point): void {
    switch (this.tool) {
      case 'pencil':
      case 'eraser':
        this.plotAll(linePoints(this.last, p));
        break;
      case 'line':
        this.changeMap.clear();
        this.plotAll(linePoints(this.start, p));
        break;
      case 'rect':
        this.changeMap.clear();
        this.plotAll(rectPoints(this.start, p, this.options.filled ?? false));
        break;
      case 'bucket':
        break;
    }
    this.last = p;
  }

  /** The command for the whole stroke, or `null` when it changes nothing. */
  finish(): Command | null {
    const patch = createPatch(this.pixels, this.changeMap);
    return patch ? { kind: 'pixels', patch } : null;
  }

  private allowed(index: number): boolean {
    return this.options.mask.bits[index] === 1;
  }

  private write(index: number): void {
    if (!this.allowed(index)) return;
    this.changeMap.set(index, this.color);
    if (this.options.mirror) {
      const m = mirrorMap(this.options.model)[index] ?? -1;
      if (m >= 0) this.changeMap.set(m, this.color);
    }
  }

  private plotAll(points: readonly Point[]): void {
    for (const p of points) if (inTexture(p)) this.write(p.y * SKIN_WIDTH + p.x);
  }

  /** Bucket: contiguous same-color texels within the start texel's face. */
  private fill(): void {
    const region = regionAt(this.start.x, this.start.y, this.options.model);
    if (!region) return;
    const indices = floodFillIndices(this.pixels, this.start, (i) => {
      const x = i % SKIN_WIDTH;
      return this.allowed(i) && rectContains(region.rect, x, (i - x) / SKIN_WIDTH);
    });
    for (const i of indices) this.write(i);
  }
}

/** Eyedropper: the color at a texel, or `null` outside the texture. */
export function pickColor(pixels: PixelBuffer, p: Point): Rgba | null {
  return getPixel(pixels, p.x, p.y);
}
