import { describe, expect, it } from 'vitest';
import { contrastRatio, parseHex, readableTextOn } from './color';

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
