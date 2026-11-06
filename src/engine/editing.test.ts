/**
 * Editing engine: masks, mirror map, shapes, document commands, tools and the
 * document store (ARCHITECTURE §4.6 invariants).
 */
import { describe, expect, it, vi } from 'vitest';
import {
  applyCommand,
  blankDocument,
  createDocument,
  createPatch,
  invertCommand,
} from './document/document';
import { DocumentStore } from './document/store';
import { faceRect, regionAt } from './format/regions';
import { editMask, maskCount, maskHas, regionMask } from './mask/mask';
import { createPixelBuffer, fillRect, getPixel, setPixel } from './model/pixel-buffer';
import { SKIN_MODELS, SKIN_WIDTH, type Rgba } from './model/types';
import { floodFillIndices, linePoints, rectPoints } from './raster/shapes';
import { MIRROR_PART, mirrorFacePosition, mirrorMap, mirrorPoint } from './symmetry/mirror';
import { pickColor, Stroke, type ToolOptions } from './tools/tools';

const RED: Rgba = { r: 255, g: 0, b: 0, a: 255 };
const BLUE: Rgba = { r: 0, g: 0, b: 255, a: 255 };
const CLEAR: Rgba = { r: 0, g: 0, b: 0, a: 0 };

const cuboidArea = (w: number, h: number, d: number) => 2 * w * d + 2 * d * h + 2 * w * h;

function options(overrides: Partial<ToolOptions> = {}): ToolOptions {
  return {
    color: RED,
    mask: editMask('classic', 'all', ['inner', 'outer']),
    model: 'classic',
    mirror: false,
    ...overrides,
  };
}

/** Runs a stroke through `points` and applies it to a copy of `doc`. */
function draw(
  tool: Stroke['tool'],
  points: { x: number; y: number }[],
  opts = options(),
  doc = blankDocument(),
) {
  const [first, ...rest] = points;
  if (!first) throw new Error('no points');
  const stroke = new Stroke(tool, doc.pixels, opts, first);
  for (const p of rest) stroke.move(p);
  const command = stroke.finish();
  return { command, doc: command ? applyCommand(doc, command) : doc };
}

describe('masks', () => {
  it('cover exactly the used face area of each model', () => {
    const head = cuboidArea(8, 8, 8);
    const body = cuboidArea(8, 12, 4);
    const limb = cuboidArea(4, 12, 4);
    const slimArm = cuboidArea(3, 12, 4);
    expect(maskCount(regionMask('classic'))).toBe(2 * (head + body + 4 * limb));
    expect(maskCount(regionMask('slim'))).toBe(2 * (head + body + 2 * limb + 2 * slimArm));
  });

  it('edit mask restricts to one body part and the chosen skin layers', () => {
    const headInner = editMask('classic', 'head', ['inner']);
    expect(maskHas(headInner, 8, 8)).toBe(true); // head front
    expect(maskHas(headInner, 40, 8)).toBe(false); // hat
    expect(maskHas(headInner, 20, 20)).toBe(false); // body
    expect(maskHas(headInner, 0, 0)).toBe(false); // unused
    expect(maskCount(editMask('classic', 'all', []))).toBe(0);
    expect(maskCount(editMask('classic', 'all', ['outer']))).toBe(
      maskCount(editMask('classic', 'all', ['inner'])),
    );
  });
});

describe('mirror map', () => {
  it('flips faces and swaps right ↔ left side faces', () => {
    expect(mirrorFacePosition('front', 0, 8, 8)).toEqual({ face: 'front', fx: 7 });
    expect(mirrorFacePosition('top', 1, 8, 8)).toEqual({ face: 'top', fx: 6 });
    expect(mirrorFacePosition('right', 7, 8, 8)).toEqual({ face: 'left', fx: 0 });
    expect(mirrorFacePosition('back', 0, 3, 4)).toEqual({ face: 'back', fx: 2 });
  });

  it.each(SKIN_MODELS)('%s: is an involution that keeps the layer and pairs limbs', (model) => {
    const map = mirrorMap(model);
    for (let i = 0; i < map.length; i++) {
      const region = regionAt(i % SKIN_WIDTH, Math.floor(i / SKIN_WIDTH), model);
      const target = map[i] ?? -1;
      if (!region) {
        expect(target).toBe(-1);
        continue;
      }
      expect(map[target]).toBe(i);
      const mirrored = regionAt(target % SKIN_WIDTH, Math.floor(target / SKIN_WIDTH), model);
      expect(mirrored?.part).toBe(MIRROR_PART[region.part]);
      expect(mirrored?.layer).toBe(region.layer);
    }
  });

  it('pairs known texels', () => {
    expect(mirrorPoint(8, 8, 'classic')).toEqual({ x: 15, y: 8 }); // head front
    expect(mirrorPoint(0, 8, 'classic')).toEqual({ x: 23, y: 8 }); // head right ↔ left face
    expect(mirrorPoint(44, 20, 'classic')).toEqual({ x: 39, y: 52 }); // right ↔ left arm front
    expect(mirrorPoint(44, 20, 'slim')).toEqual({ x: 38, y: 52 });
    expect(mirrorPoint(4, 20, 'classic')).toEqual({ x: 23, y: 52 }); // legs
    expect(mirrorPoint(0, 0, 'classic')).toBeNull(); // unused
  });
});

describe('shapes', () => {
  it('lines include both endpoints with no gaps', () => {
    expect(linePoints({ x: 0, y: 0 }, { x: 0, y: 0 })).toEqual([{ x: 0, y: 0 }]);
    expect(linePoints({ x: 0, y: 0 }, { x: 3, y: 0 })).toHaveLength(4);
    const diagonal = linePoints({ x: 5, y: 5 }, { x: 1, y: 2 });
    expect(diagonal[0]).toEqual({ x: 5, y: 5 });
    expect(diagonal.at(-1)).toEqual({ x: 1, y: 2 });
    for (let i = 1; i < diagonal.length; i++) {
      const a = diagonal[i - 1];
      const b = diagonal[i];
      expect(
        Math.max(Math.abs((a?.x ?? 0) - (b?.x ?? 0)), Math.abs((a?.y ?? 0) - (b?.y ?? 0))),
      ).toBe(1);
    }
  });

  it('rectangles: outline or filled, from any two corners', () => {
    expect(rectPoints({ x: 3, y: 3 }, { x: 0, y: 0 }, false)).toHaveLength(12);
    expect(rectPoints({ x: 0, y: 0 }, { x: 3, y: 3 }, true)).toHaveLength(16);
    expect(rectPoints({ x: 2, y: 2 }, { x: 2, y: 2 }, false)).toEqual([{ x: 2, y: 2 }]);
  });

  it('flood fill is 4-connected, exact-color and bounded by `allowed`', () => {
    const b = createPixelBuffer(8, 8);
    fillRect(b, { x: 0, y: 0, w: 8, h: 8 }, BLUE);
    fillRect(b, { x: 4, y: 0, w: 1, h: 8 }, RED); // wall
    setPixel(b, 0, 0, { ...BLUE, a: 254 }); // differs only in alpha
    const filled = floodFillIndices(b, { x: 1, y: 1 }, () => true);
    expect(filled).toHaveLength(4 * 8 - 1);
    expect(filled).not.toContain(0);
    const bounded = floodFillIndices(b, { x: 1, y: 1 }, (i) => i % 8 < 2);
    expect(bounded).toHaveLength(2 * 8 - 1);
    expect(floodFillIndices(b, { x: 9, y: 0 }, () => true)).toEqual([]);
    expect(floodFillIndices(b, { x: 1, y: 1 }, () => false)).toEqual([]);
  });
});

describe('document commands', () => {
  it('createDocument copies the pixels and rejects other sizes', () => {
    const pixels = createPixelBuffer();
    const doc = createDocument(pixels, 'slim');
    setPixel(pixels, 8, 8, RED);
    expect(getPixel(doc.pixels, 8, 8)).toEqual(CLEAR);
    expect(() => createDocument(createPixelBuffer(64, 32), 'classic')).toThrow(RangeError);
  });

  it('a patch covers the bounding rectangle of the real changes only', () => {
    const doc = blankDocument();
    const changes = new Map([
      [8 * 64 + 8, RED],
      [10 * 64 + 12, RED],
      [0, CLEAR], // already transparent: not a change
    ]);
    const patch = createPatch(doc.pixels, changes);
    expect(patch?.rect).toEqual({ x: 8, y: 8, w: 5, h: 3 });
    expect(createPatch(doc.pixels, new Map([[0, CLEAR]]))).toBeNull();
  });

  it('apply then invert restores identical bytes; the input document is not modified', () => {
    const doc = blankDocument();
    const before = new Uint8ClampedArray(doc.pixels.data);
    const { command, doc: after } = draw(
      'pencil',
      [
        { x: 8, y: 8 },
        { x: 12, y: 10 },
      ],
      options(),
      doc,
    );
    if (!command) throw new Error('expected a command');
    expect(doc.pixels.data).toEqual(before);
    expect(getPixel(after.pixels, 8, 8)).toEqual(RED);
    expect(applyCommand(after, invertCommand(command)).pixels.data).toEqual(before);
  });

  it('model changes and document replacement invert', () => {
    const doc = blankDocument('classic');
    const slim = applyCommand(doc, { kind: 'setModel', before: 'classic', after: 'slim' });
    expect(slim.model).toBe('slim');
    expect(
      applyCommand(slim, invertCommand({ kind: 'setModel', before: 'classic', after: 'slim' }))
        .model,
    ).toBe('classic');
    const other = blankDocument('slim');
    const replaced = applyCommand(doc, { kind: 'replace', before: doc, after: other });
    expect(replaced).toBe(other);
    expect(
      applyCommand(replaced, invertCommand({ kind: 'replace', before: doc, after: other })),
    ).toBe(doc);
  });
});

describe('tools', () => {
  it('pencil paints connected strokes with the chosen color', () => {
    const { doc } = draw('pencil', [
      { x: 8, y: 8 },
      { x: 11, y: 8 },
    ]);
    for (let x = 8; x <= 11; x++) expect(getPixel(doc.pixels, x, 8)).toEqual(RED);
    expect(getPixel(doc.pixels, 12, 8)).toEqual(CLEAR);
  });

  it('eraser makes pixels transparent', () => {
    const start = draw('pencil', [
      { x: 8, y: 8 },
      { x: 10, y: 8 },
    ]).doc;
    const { doc } = draw('eraser', [{ x: 9, y: 8 }], options(), start);
    expect(getPixel(doc.pixels, 9, 8)).toEqual(CLEAR);
    expect(getPixel(doc.pixels, 8, 8)).toEqual(RED);
  });

  it('never writes outside the edit mask (ARCHITECTURE §4.6, invariant 8)', () => {
    const mask = editMask('classic', 'head', ['inner']);
    // A line across the whole texture.
    const { doc } = draw(
      'line',
      [
        { x: 0, y: 0 },
        { x: 63, y: 63 },
      ],
      options({ mask }),
    );
    for (let i = 0; i < 64 * 64; i++) {
      if (mask.bits[i] !== 1) expect(doc.pixels.data[i * 4 + 3]).toBe(0);
    }
    expect(maskHas(mask, 8, 8)).toBe(true);
    expect(getPixel(doc.pixels, 8, 8)).toEqual(RED);
  });

  it('inner and outer layers are edited independently', () => {
    const innerOnly = options({ mask: editMask('classic', 'all', ['inner']) });
    const { doc } = draw(
      'rect',
      [
        { x: 0, y: 0 },
        { x: 63, y: 15 },
      ],
      { ...innerOnly, filled: true },
    );
    expect(getPixel(doc.pixels, 8, 8)).toEqual(RED); // head
    expect(getPixel(doc.pixels, 40, 8)).toEqual(CLEAR); // hat untouched
    const outerOnly = options({ mask: editMask('classic', 'all', ['outer']) });
    const hat = draw(
      'pencil',
      [
        { x: 40, y: 8 },
        { x: 8, y: 8 },
      ],
      outerOnly,
      doc,
    ).doc;
    expect(getPixel(hat.pixels, 40, 8)).toEqual(RED);
  });

  it('mirror drawing paints the mirrored texel too', () => {
    const { doc } = draw('pencil', [{ x: 44, y: 20 }], options({ mirror: true }));
    expect(getPixel(doc.pixels, 44, 20)).toEqual(RED);
    expect(getPixel(doc.pixels, 39, 52)).toEqual(RED); // left arm front, outer edge
    const slim = draw(
      'pencil',
      [{ x: 44, y: 20 }],
      options({ mirror: true, model: 'slim', mask: editMask('slim', 'all', ['inner']) }),
    );
    expect(getPixel(slim.doc.pixels, 38, 52)).toEqual(RED);
  });

  it('line and rectangle show only their latest shape while dragging', () => {
    const stroke = new Stroke('line', blankDocument().pixels, options(), { x: 8, y: 8 });
    stroke.move({ x: 15, y: 8 });
    stroke.move({ x: 8, y: 15 });
    expect([...stroke.changes.keys()]).not.toContain(8 * 64 + 15);
    expect(stroke.changes.size).toBe(8);

    const outline = draw('rect', [
      { x: 8, y: 8 },
      { x: 15, y: 15 },
    ]).doc;
    expect(getPixel(outline.pixels, 8, 8)).toEqual(RED);
    expect(getPixel(outline.pixels, 10, 10)).toEqual(CLEAR);
    const filled = draw(
      'rect',
      [
        { x: 8, y: 8 },
        { x: 15, y: 15 },
      ],
      options({ filled: true }),
    ).doc;
    expect(getPixel(filled.pixels, 10, 10)).toEqual(RED);
  });

  it('bucket fills contiguous same-color texels within the start face only', () => {
    const doc = blankDocument();
    const front = faceRect('head', 'inner', 'front', 'classic');
    const pixels = createPixelBuffer();
    // Head front and right faces are both blue and touch each other.
    fillRect(pixels, { x: 0, y: 8, w: 16, h: 8 }, BLUE);
    setPixel(pixels, front.x + 4, front.y + 4, RED); // an island in the front face
    const start = createDocument(pixels, 'classic');
    const { doc: filled } = draw(
      'bucket',
      [{ x: front.x, y: front.y }],
      options({ color: { r: 0, g: 200, b: 0, a: 255 } }),
      start,
    );
    expect(getPixel(filled.pixels, front.x + 7, front.y + 7)?.g).toBe(200);
    expect(getPixel(filled.pixels, front.x + 4, front.y + 4)).toEqual(RED); // different color kept
    expect(getPixel(filled.pixels, 0, 8)).toEqual(BLUE); // neighboring face untouched
    expect(doc.pixels.data.every((v) => v === 0)).toBe(true);
  });

  it('bucket with the color already there, or on an unused texel, changes nothing', () => {
    const blue = createDocument(
      (() => {
        const p = createPixelBuffer();
        fillRect(p, { x: 8, y: 8, w: 8, h: 8 }, BLUE);
        return p;
      })(),
      'classic',
    );
    expect(draw('bucket', [{ x: 8, y: 8 }], options({ color: BLUE }), blue).command).toBeNull();
    expect(draw('bucket', [{ x: 0, y: 0 }]).command).toBeNull();
  });

  it('eyedropper reads the texel, transparency included', () => {
    const pixels = createPixelBuffer();
    setPixel(pixels, 3, 4, { r: 1, g: 2, b: 3, a: 128 });
    expect(pickColor(pixels, { x: 3, y: 4 })).toEqual({ r: 1, g: 2, b: 3, a: 128 });
    expect(pickColor(pixels, { x: 64, y: 0 })).toBeNull();
  });
});

describe('DocumentStore (ARCHITECTURE §4.6)', () => {
  const stroke = (store: DocumentStore, x: number, color = RED) => {
    const s = new Stroke('pencil', store.document.pixels, options({ color }), { x, y: 8 });
    const command = s.finish();
    if (command) store.dispatch(command);
  };

  it('undo → redo is byte-identical, and N undos return to the start', () => {
    const store = new DocumentStore(blankDocument());
    const start = new Uint8ClampedArray(store.document.pixels.data);
    for (let x = 8; x < 16; x++) stroke(store, x, { r: x * 10, g: 0, b: 0, a: 255 });
    const end = new Uint8ClampedArray(store.document.pixels.data);
    store.undo();
    store.redo();
    expect(store.document.pixels.data).toEqual(end);
    while (store.undo()) {
      /* undo everything */
    }
    expect(store.document.pixels.data).toEqual(start);
    expect(store.getSnapshot().canUndo).toBe(false);
    expect(store.getSnapshot().canRedo).toBe(true);
  });

  it('notifies subscribers with strictly increasing revisions', () => {
    const store = new DocumentStore(blankDocument());
    const revisions: number[] = [];
    store.subscribe(() => revisions.push(store.getSnapshot().revision));
    stroke(store, 8);
    store.setPreview(new Map([[0, RED]]));
    store.setPreview(null);
    store.undo();
    store.redo();
    expect(revisions).toHaveLength(5);
    for (let i = 1; i < revisions.length; i++)
      expect(revisions[i]).toBeGreaterThan(revisions[i - 1] ?? 0);
  });

  it('a preview shows in the texture but never changes the document or history', () => {
    const store = new DocumentStore(blankDocument());
    const index = 8 * 64 + 8;
    store.setPreview(new Map([[index, RED]]));
    const snap = store.getSnapshot();
    expect(snap.texture.data[index * 4 + 3]).toBe(255);
    expect(snap.document.pixels.data[index * 4 + 3]).toBe(0);
    expect(snap.canUndo).toBe(false);
    store.setPreview(null);
    expect(store.getSnapshot().texture).toBe(store.document.pixels);
  });

  it('a new edit clears redo; the snapshot is stable between changes', () => {
    const store = new DocumentStore(blankDocument());
    stroke(store, 8);
    store.undo();
    stroke(store, 9);
    expect(store.getSnapshot().canRedo).toBe(false);
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it('bounded history drops old steps without changing the document', () => {
    const store = new DocumentStore(blankDocument(), { historyLimit: 3 });
    for (let x = 8; x < 14; x++) stroke(store, x);
    const current = new Uint8ClampedArray(store.document.pixels.data);
    expect(store.historySize).toBe(3);
    expect(store.document.pixels.data).toEqual(current);
    while (store.undo()) {
      /* undo what is kept */
    }
    // The three oldest strokes stay: they fell out of history.
    expect(getPixel(store.document.pixels, 10, 8)).toEqual(RED);
    expect(getPixel(store.document.pixels, 11, 8)).toEqual(CLEAR);
  });

  it('load replaces the document and clears history', () => {
    const store = new DocumentStore(blankDocument());
    stroke(store, 8);
    const listener = vi.fn();
    store.subscribe(listener);
    store.load(blankDocument('slim'));
    expect(listener).toHaveBeenCalledOnce();
    expect(store.document.model).toBe('slim');
    expect(store.getSnapshot().canUndo).toBe(false);
  });
});
