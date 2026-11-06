import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  formatHexColor,
  hsvToRgb,
  parseHex,
  parseHexColor,
  readableTextOn,
  rgbToHsv,
} from './color';

describe('parseHex', () => {
  it('parses #rrggbb with or without hash', () => {
    expect(parseHex('#4fd16b')).toEqual({ r: 0x4f, g: 0xd1, b: 0x6b });
    expect(parseHex('FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('rejects other formats', () => {
    expect(parseHex('#fff')).toBeNull();
    expect(parseHex('rgb(0,0,0)')).toBeNull();
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for identical colors', () => {
    const black = { r: 0, g: 0, b: 0 };
    const white = { r: 255, g: 255, b: 255 };
    expect(contrastRatio(black, white)).toBeCloseTo(21, 1);
    expect(contrastRatio(white, white)).toBe(1);
  });
});

describe('readableTextOn', () => {
  it('uses dark text on light accents and white text on dark accents', () => {
    expect(readableTextOn('#4fd16b')).toBe('#06120a');
    expect(readableTextOn('#f2c94c')).toBe('#06120a');
    expect(readableTextOn('#1e3a8a')).toBe('#ffffff');
  });

  it('falls back to white for invalid input', () => {
    expect(readableTextOn('nope')).toBe('#ffffff');
  });
});

describe('HEX colors with alpha', () => {
  it('parses #rgb, #rrggbb and #rrggbbaa, with or without #', () => {
    expect(parseHexColor('#f80')).toEqual({ r: 255, g: 136, b: 0, a: 255 });
    expect(parseHexColor('3FA34D')).toEqual({ r: 0x3f, g: 0xa3, b: 0x4d, a: 255 });
    expect(parseHexColor(' #3fa34d80 ')).toEqual({ r: 0x3f, g: 0xa3, b: 0x4d, a: 0x80 });
  });

  it('rejects anything else', () => {
    for (const bad of ['', '#', '#12', '#12345', '#1234567', 'red', '#ggg', 'rgb(1,2,3)']) {
      expect(parseHexColor(bad)).toBeNull();
    }
  });

  it('formats lowercase, adding alpha only when not opaque', () => {
    expect(formatHexColor({ r: 63, g: 163, b: 77, a: 255 })).toBe('#3fa34d');
    expect(formatHexColor({ r: 255, g: 0, b: 0, a: 0 })).toBe('#ff000000');
    const c = { r: 12, g: 200, b: 99, a: 77 };
    expect(parseHexColor(formatHexColor(c))).toEqual(c);
  });
});

describe('HSV conversion', () => {
  it('converts primaries and grays', () => {
    expect(rgbToHsv({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 1, v: 1 });
    expect(rgbToHsv({ r: 0, g: 255, b: 0 }).h).toBe(120);
    expect(rgbToHsv({ r: 0, g: 0, b: 255 }).h).toBe(240);
    expect(rgbToHsv({ r: 128, g: 128, b: 128 })).toMatchObject({ h: 0, s: 0 });
    expect(hsvToRgb({ h: 60, s: 1, v: 1 })).toEqual({ r: 255, g: 255, b: 0 });
    expect(hsvToRgb({ h: 200, s: 0, v: 0 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('round-trips every 8-bit color sample exactly', () => {
    for (let r = 0; r < 256; r += 17) {
      for (let g = 0; g < 256; g += 51) {
        for (let b = 0; b < 256; b += 85) {
          expect(hsvToRgb(rgbToHsv({ r, g, b }))).toEqual({ r, g, b });
        }
      }
    }
  });
});
