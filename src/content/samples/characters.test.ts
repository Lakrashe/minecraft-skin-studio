import { describe, expect, it } from 'vitest';
import { allFaceRegions, getPixel, regionAt } from '@/engine';
import { SAMPLE_CHARACTERS, getSample, isSampleId, sampleSkin } from './characters';

describe.each(SAMPLE_CHARACTERS.map((s) => [s.id, s] as const))('sample "%s"', (_id, sample) => {
  const skin = sample.paint();

  it('is a 64×64 RGBA texture', () => {
    expect(skin.width).toBe(64);
    expect(skin.height).toBe(64);
    expect(skin.data.length).toBe(64 * 64 * 4);
  });

  it('has a fully opaque inner layer (base layer must be opaque in game)', () => {
    for (const { layer, rect, part, face } of allFaceRegions(sample.model)) {
      if (layer !== 'inner') continue;
      for (let y = rect.y; y < rect.y + rect.h; y++) {
        for (let x = rect.x; x < rect.x + rect.w; x++) {
          expect(getPixel(skin, x, y)?.a, `${part}.${face} @${String(x)},${String(y)}`).toBe(255);
        }
      }
    }
  });

  it('leaves every unused texture pixel transparent', () => {
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        if (regionAt(x, y, sample.model) === null) {
          expect(getPixel(skin, x, y)?.a, `unused @${String(x)},${String(y)}`).toBe(0);
        }
      }
    }
  });

  it('uses the outer layer as declared', () => {
    const outerOpaque = allFaceRegions(sample.model)
      .filter((r) => r.layer === 'outer')
      .some(({ rect }) => {
        for (let y = rect.y; y < rect.y + rect.h; y++) {
          for (let x = rect.x; x < rect.x + rect.w; x++) {
            if ((getPixel(skin, x, y)?.a ?? 0) > 0) return true;
          }
        }
        return false;
      });
    expect(outerOpaque).toBe(sample.usesOuterLayer);
  });

  it('is deterministic', () => {
    expect(sample.paint().data).toEqual(skin.data);
  });
});

describe('sample registry', () => {
  it('caches painted skins', () => {
    expect(sampleSkin('knight')).toBe(sampleSkin('knight'));
  });

  it('validates ids', () => {
    expect(isSampleId('mage')).toBe(true);
    expect(isSampleId('steve')).toBe(false);
    expect(() => getSample('nope' as never)).toThrow();
  });

  it('includes both arm models', () => {
    expect(new Set(SAMPLE_CHARACTERS.map((s) => s.model))).toEqual(new Set(['classic', 'slim']));
  });
});
