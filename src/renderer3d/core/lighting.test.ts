import { describe, expect, it } from 'vitest';
import {
  clampLightIntensity,
  isLightingPreset,
  LIGHTING_PRESETS,
  lightingRig,
  MAX_LIGHT_INTENSITY,
  MIN_LIGHT_INTENSITY,
} from './lighting';

describe('lighting presets', () => {
  it('every preset is valid: lit presets have lights, flat is unlit with none', () => {
    for (const preset of LIGHTING_PRESETS) {
      const rig = lightingRig(preset);
      expect(rig.preset).toBe(preset);
      if (preset === 'flat') {
        expect(rig).toMatchObject({ unlit: true, lights: [] });
      } else {
        expect(rig.unlit).toBe(false);
        expect(rig.lights.length).toBeGreaterThan(0);
        for (const light of rig.lights) {
          expect(light.intensity).toBeGreaterThan(0);
          expect(light.color).toMatch(/^#[0-9a-f]{6}$/);
        }
      }
    }
  });

  it('intensity scales every light, within limits', () => {
    const base = lightingRig('studio', 1).lights.map((l) => l.intensity);
    const double = lightingRig('studio', 2).lights.map((l) => l.intensity);
    double.forEach((v, i) => {
      expect(v).toBeCloseTo((base[i] ?? 0) * 2);
    });
    expect(clampLightIntensity(10)).toBe(MAX_LIGHT_INTENSITY);
    expect(clampLightIntensity(0)).toBe(MIN_LIGHT_INTENSITY);
    expect(clampLightIntensity(Number.NaN)).toBe(1);
  });

  it('recognizes preset ids', () => {
    expect(isLightingPreset('sunset')).toBe(true);
    expect(isLightingPreset('disco')).toBe(false);
    expect(isLightingPreset(3)).toBe(false);
  });
});
