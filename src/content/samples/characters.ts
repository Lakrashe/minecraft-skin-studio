/**
 * Original sample characters designed for this project (no Mojang assets).
 * Shown on the homepage and in the studio viewer; they become editable
 * starting skins once the editor exists (decision D9).
 */
import { TRANSPARENT, type PixelBuffer, type SkinModel } from '@/engine';
import {
  ARMS,
  LEGS,
  SkinPainter,
  hex,
  paintFace,
  paintHair,
  paintSkinBase,
  shade,
} from './painter';

export const SAMPLE_IDS = ['explorer', 'knight', 'mage', 'runner'] as const;
export type SampleId = (typeof SAMPLE_IDS)[number];

export interface SampleCharacter {
  readonly id: SampleId;
  readonly model: SkinModel;
  /** Uses the outer skin layer (hat/jacket/sleeves/pants). */
  readonly usesOuterLayer: boolean;
  readonly paint: () => PixelBuffer;
}

function explorer(): PixelBuffer {
  const p = new SkinPainter('classic', 1);
  const skin = hex('#c98e66');
  const hair = hex('#3b2a1e');
  const jacket = hex('#2f8f4e');
  const shirt = hex('#e8dcc0');
  const pants = hex('#8a7a55');
  const boots = hex('#4a3324');
  const leather = hex('#6b4a2f');
  const gold = hex('#d8b04a');

  paintSkinBase(p, skin);
  paintFace(p, { skin, eyes: hex('#2f7a45'), brows: hair });
  paintHair(p, hair, 'short');

  p.part('body', 'inner', jacket);
  p.rect('body', 'inner', 'front', 3, 0, 2, 8, shirt, 0.02);
  p.band('body', 'inner', 8, 10, leather);
  p.rect('body', 'inner', 'front', 3, 8, 2, 1, gold, 0);
  p.rect('body', 'inner', 'back', 1, 1, 6, 8, leather, 0.06); // backpack
  p.rect('body', 'inner', 'front', 1, 0, 1, 8, leather); // straps
  p.rect('body', 'inner', 'front', 6, 0, 1, 8, leather);

  p.pair(ARMS, (arm) => {
    p.part(arm, 'inner', jacket);
    p.band(arm, 'inner', 9, 10, shade(jacket, 0.8));
    p.band(arm, 'inner', 10, 12, skin, 0.02);
    p.face(arm, 'inner', 'bottom', skin, 0.02);
  });
  p.pair(LEGS, (leg) => {
    p.part(leg, 'inner', pants);
    p.band(leg, 'inner', 9, 12, boots);
    p.face(leg, 'inner', 'bottom', shade(boots, 0.8));
  });

  // Outer layer: a little extra hair volume.
  p.rect('head', 'outer', 'top', 2, 2, 4, 4, hair, 0.1);
  p.rect('head', 'outer', 'front', 2, 0, 4, 1, hair, 0.1);
  return p.buffer;
}

function knight(): PixelBuffer {
  const p = new SkinPainter('classic', 2);
  const skin = hex('#d7a47e');
  const steel = hex('#9aa3ad');
  const darkSteel = hex('#5e6670');
  const chain = hex('#737a82');
  const tabard = hex('#a8323a');
  const gold = hex('#d8b04a');

  paintSkinBase(p, skin);
  paintFace(p, { skin, eyes: hex('#3d5a8a'), brows: hex('#8a6a3a') });
  paintHair(p, hex('#8a6a3a'), 'short');

  // Helmet on the outer (hat) layer with an eye slit showing the face below.
  for (const face of ['top', 'right', 'left', 'back', 'front'] as const) {
    p.face('head', 'outer', face, steel, 0.06);
  }
  for (let x = 1; x <= 6; x++) p.pixel('head', 'outer', 'front', x, 4, TRANSPARENT);
  for (const x of [2, 5]) p.pixel('head', 'outer', 'front', x, 6, darkSteel);
  p.rect('head', 'outer', 'top', 3, 0, 2, 8, tabard, 0.05); // crest

  p.part('body', 'inner', steel, 0.05);
  p.rect('body', 'inner', 'front', 2, 1, 4, 11, tabard, 0.03);
  p.rect('body', 'inner', 'back', 2, 1, 4, 11, tabard, 0.03);
  p.band('body', 'inner', 0, 1, gold, 0.02);
  p.band('body', 'inner', 8, 9, darkSteel);
  p.rect('body', 'inner', 'front', 3, 4, 2, 2, gold, 0); // emblem

  p.pair(ARMS, (arm) => {
    p.part(arm, 'inner', chain, 0.12);
    p.band(arm, 'inner', 0, 4, steel, 0.05);
    p.band(arm, 'inner', 9, 12, darkSteel);
    p.face(arm, 'inner', 'top', steel);
    p.face(arm, 'inner', 'bottom', darkSteel);
  });
  p.pair(LEGS, (leg) => {
    p.part(leg, 'inner', chain, 0.12);
    p.band(leg, 'inner', 5, 10, steel, 0.05);
    p.band(leg, 'inner', 10, 12, darkSteel);
    p.face(leg, 'inner', 'bottom', darkSteel);
  });
  return p.buffer;
}

function mage(): PixelBuffer {
  const p = new SkinPainter('slim', 3);
  const skin = hex('#e9c9a8');
  const robe = hex('#4b2e83');
  const gold = hex('#d9b44a');
  const hair = hex('#cfd3dc');

  paintSkinBase(p, skin);
  paintFace(p, { skin, eyes: hex('#b67cff'), brows: hair });
  paintHair(p, hair, 'long');

  // Hood on the outer (hat) layer, framing the face.
  for (const face of ['top', 'right', 'left', 'back'] as const)
    p.face('head', 'outer', face, robe, 0.06);
  p.rect('head', 'outer', 'front', 0, 0, 8, 1, robe, 0.06);
  p.rect('head', 'outer', 'front', 0, 1, 1, 7, robe, 0.06);
  p.rect('head', 'outer', 'front', 7, 1, 1, 7, robe, 0.06);

  p.part('body', 'inner', robe);
  p.band('body', 'inner', 7, 8, gold, 0.02);
  for (const [x, y] of [
    [2, 0],
    [5, 0],
    [3, 1],
    [4, 1],
  ] as const) {
    p.pixel('body', 'inner', 'front', x, y, skin);
  }
  // Cape on the outer (jacket) layer.
  p.face('body', 'outer', 'back', shade(robe, 0.8), 0.05);

  p.pair(ARMS, (arm) => {
    p.part(arm, 'inner', robe);
    p.band(arm, 'inner', 8, 9, gold, 0.02);
    p.band(arm, 'inner', 9, 12, skin, 0.02);
    p.face(arm, 'inner', 'bottom', skin, 0.02);
  });
  p.pair(LEGS, (leg) => {
    p.part(leg, 'inner', robe);
    p.band(leg, 'inner', 9, 10, gold, 0.02);
    p.band(leg, 'inner', 10, 12, hex('#2a1f3d'));
    p.face(leg, 'inner', 'bottom', hex('#2a1f3d'));
  });
  return p.buffer;
}

function runner(): PixelBuffer {
  const p = new SkinPainter('slim', 4);
  const skin = hex('#8d5a3b');
  const suit = hex('#1d2027');
  const neon = hex('#37e3ff');
  const jacket = hex('#111318');
  const white = hex('#e8eaee');

  paintSkinBase(p, skin);
  paintFace(p, { skin, eyes: neon, brows: hex('#2b1d14') });
  paintHair(p, white, 'short');

  // Visor on the outer (hat) layer.
  p.rect('head', 'outer', 'front', 0, 3, 8, 2, neon, 0.08);
  p.rect('head', 'outer', 'right', 4, 3, 4, 2, shade(neon, 0.7), 0);
  p.rect('head', 'outer', 'left', 0, 3, 4, 2, shade(neon, 0.7), 0);

  p.part('body', 'inner', suit);
  p.rect('body', 'inner', 'front', 2, 0, 1, 12, neon, 0);
  p.rect('body', 'inner', 'front', 5, 0, 1, 12, neon, 0);
  // Open jacket on the outer (jacket) layer.
  for (const face of ['right', 'left', 'back'] as const)
    p.face('body', 'outer', face, jacket, 0.05);
  p.rect('body', 'outer', 'front', 0, 0, 2, 12, jacket, 0.05);
  p.rect('body', 'outer', 'front', 6, 0, 2, 12, jacket, 0.05);
  p.rect('body', 'outer', 'top', 0, 0, 8, 4, jacket, 0.05);

  p.pair(ARMS, (arm) => {
    p.part(arm, 'inner', suit);
    p.band(arm, 'inner', 4, 5, neon, 0);
    p.band(arm, 'inner', 10, 12, skin, 0.02);
    p.face(arm, 'inner', 'bottom', skin, 0.02);
    p.band(arm, 'outer', 0, 8, jacket, 0.05);
  });
  p.pair(LEGS, (leg) => {
    p.part(leg, 'inner', suit);
    p.band(leg, 'inner', 9, 12, white, 0.03);
    p.band(leg, 'inner', 11, 12, neon, 0);
    p.face(leg, 'inner', 'bottom', white);
  });
  p.rect('rightLeg', 'inner', 'right', 1, 0, 1, 9, neon, 0);
  p.rect('leftLeg', 'inner', 'left', 2, 0, 1, 9, neon, 0);
  return p.buffer;
}

export const SAMPLE_CHARACTERS: readonly SampleCharacter[] = [
  { id: 'explorer', model: 'classic', usesOuterLayer: true, paint: explorer },
  { id: 'knight', model: 'classic', usesOuterLayer: true, paint: knight },
  { id: 'mage', model: 'slim', usesOuterLayer: true, paint: mage },
  { id: 'runner', model: 'slim', usesOuterLayer: true, paint: runner },
];

const cache = new Map<SampleId, PixelBuffer>();

/** The sample's texture. Painted once and cached; treat it as read-only. */
export function sampleSkin(id: SampleId): PixelBuffer {
  let buffer = cache.get(id);
  if (!buffer) {
    const sample = getSample(id);
    buffer = sample.paint();
    cache.set(id, buffer);
  }
  return buffer;
}

export function isSampleId(value: unknown): value is SampleId {
  return typeof value === 'string' && (SAMPLE_IDS as readonly string[]).includes(value);
}

export function getSample(id: SampleId): SampleCharacter {
  const sample = SAMPLE_CHARACTERS.find((s) => s.id === id);
  if (!sample) throw new Error(`Unknown sample ${id}`);
  return sample;
}
