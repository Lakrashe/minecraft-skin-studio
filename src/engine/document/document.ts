/**
 * The skin document and the commands that change it (ARCHITECTURE §3, §4.4).
 *
 * A document is immutable: commands produce a new document with a new pixel
 * buffer, so every revision's texture can be handed to views safely and undo
 * restores exact bytes.
 */
import { clonePixelBuffer, createPixelBuffer, type PixelBuffer } from '../model/pixel-buffer';
import { SKIN_HEIGHT, SKIN_WIDTH, type Rect, type Rgba, type SkinModel } from '../model/types';

export interface SkinDocument {
  readonly model: SkinModel;
  /** The 64×64 skin texture. Treat as read-only; commands replace it. */
  readonly pixels: PixelBuffer;
}

/** A document owning a copy of `pixels` (64×64). */
export function createDocument(pixels: PixelBuffer, model: SkinModel): SkinDocument {
  if (pixels.width !== SKIN_WIDTH || pixels.height !== SKIN_HEIGHT) {
    throw new RangeError(
      `A skin is ${String(SKIN_WIDTH)}×${String(SKIN_HEIGHT)}, got ${String(pixels.width)}×${String(pixels.height)}`,
    );
  }
  return { model, pixels: clonePixelBuffer(pixels) };
}

/** A fully transparent 64×64 skin. */
export function blankDocument(model: SkinModel = 'classic'): SkinDocument {
  return { model, pixels: createPixelBuffer() };
}

/** Before/after bytes of one rectangle of the texture. */
export interface PixelPatch {
  readonly rect: Rect;
  readonly before: Uint8ClampedArray;
  readonly after: Uint8ClampedArray;
}

export type Command =
  | { readonly kind: 'pixels'; readonly patch: PixelPatch }
  | { readonly kind: 'setModel'; readonly before: SkinModel; readonly after: SkinModel }
  | { readonly kind: 'replace'; readonly before: SkinDocument; readonly after: SkinDocument };

/** Pixel changes keyed by texel index (`y * 64 + x`). */
export type PixelChanges = ReadonlyMap<number, Rgba>;

function readRect(pixels: PixelBuffer, rect: Rect): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rect.w * rect.h * 4);
  for (let y = 0; y < rect.h; y++) {
    const from = ((rect.y + y) * pixels.width + rect.x) * 4;
    out.set(pixels.data.subarray(from, from + rect.w * 4), y * rect.w * 4);
  }
  return out;
}

function writeRect(pixels: PixelBuffer, rect: Rect, bytes: Uint8ClampedArray): void {
  for (let y = 0; y < rect.h; y++) {
    const to = ((rect.y + y) * pixels.width + rect.x) * 4;
    pixels.data.set(bytes.subarray(y * rect.w * 4, (y + 1) * rect.w * 4), to);
  }
}

/** A copy of `pixels` with `changes` written in. */
export function withChanges(pixels: PixelBuffer, changes: PixelChanges): PixelBuffer {
  const out = clonePixelBuffer(pixels);
  for (const [index, c] of changes) out.data.set([c.r, c.g, c.b, c.a], index * 4);
  return out;
}

/**
 * The patch that applies `changes` to `pixels`, covering their bounding
 * rectangle; `null` when nothing would actually change.
 */
export function createPatch(pixels: PixelBuffer, changes: PixelChanges): PixelPatch | null {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  let changed = false;
  for (const [index, c] of changes) {
    const i = index * 4;
    const d = pixels.data;
    if (d[i] === c.r && d[i + 1] === c.g && d[i + 2] === c.b && d[i + 3] === c.a) continue;
    changed = true;
    const x = index % pixels.width;
    const y = (index - x) / pixels.width;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  if (!changed) return null;
  const rect = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  return {
    rect,
    before: readRect(pixels, rect),
    after: readRect(withChanges(pixels, changes), rect),
  };
}

/** The command that undoes `command`. */
export function invertCommand(command: Command): Command {
  switch (command.kind) {
    case 'pixels': {
      const { rect, before, after } = command.patch;
      return { kind: 'pixels', patch: { rect, before: after, after: before } };
    }
    case 'setModel':
      return { kind: 'setModel', before: command.after, after: command.before };
    case 'replace':
      return { kind: 'replace', before: command.after, after: command.before };
  }
}

/** Applies a command, returning a new document; `doc` is not modified. */
export function applyCommand(doc: SkinDocument, command: Command): SkinDocument {
  switch (command.kind) {
    case 'pixels': {
      const pixels = clonePixelBuffer(doc.pixels);
      writeRect(pixels, command.patch.rect, command.patch.after);
      return { model: doc.model, pixels };
    }
    case 'setModel':
      return { model: command.after, pixels: doc.pixels };
    case 'replace':
      return command.after;
  }
}
