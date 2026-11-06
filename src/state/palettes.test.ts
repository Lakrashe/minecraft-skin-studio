import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_PALETTE_COLORS, MAX_PALETTES, sanitizePalettes, usePalettes } from './palettes';

beforeEach(() => {
  usePalettes.setState({ palettes: [] });
});

describe('custom palettes', () => {
  it('creates, renames, adds and removes colors', () => {
    const s = usePalettes.getState();
    const id = s.createPalette('  Armor  ', ['#AABBCC', 'red', '#aabbcc']);
    expect(id).not.toBeNull();
    if (!id) return;
    expect(usePalettes.getState().palettes).toEqual([{ id, name: 'Armor', colors: ['#aabbcc'] }]);
    s.addColor(id, '#112233');
    s.addColor(id, '#112233'); // duplicate ignored
    s.addColor(id, 'not a color');
    s.renamePalette(id, 'Steel');
    expect(usePalettes.getState().palettes[0]).toMatchObject({
      name: 'Steel',
      colors: ['#aabbcc', '#112233'],
    });
    s.removeColor(id, '#AABBCC');
    expect(usePalettes.getState().palettes[0]?.colors).toEqual(['#112233']);
    s.deletePalette(id);
    expect(usePalettes.getState().palettes).toEqual([]);
  });

  it('enforces palette and color limits', () => {
    const s = usePalettes.getState();
    for (let i = 0; i < MAX_PALETTES; i++) expect(s.createPalette(`P${String(i)}`)).not.toBeNull();
    expect(s.createPalette('one too many')).toBeNull();

    usePalettes.setState({ palettes: [] });
    const id = s.createPalette('Full') ?? '';
    for (let i = 0; i < MAX_PALETTE_COLORS + 5; i++) {
      s.addColor(id, `#0000${i.toString(16).padStart(2, '0')}`);
    }
    expect(usePalettes.getState().palettes[0]?.colors).toHaveLength(MAX_PALETTE_COLORS);
  });

  it('sanitizes saved data', () => {
    expect(sanitizePalettes(null)).toEqual([]);
    expect(sanitizePalettes({ palettes: 'x' })).toEqual([]);
    expect(
      sanitizePalettes({
        palettes: [
          { id: 'a', name: 'Ok', colors: ['#000000', 'bad', '#000000', 5] },
          { id: 'a', name: 'duplicate id', colors: [] },
          { id: '', name: 'no id', colors: [] },
          { id: 'b', name: 42, colors: [] },
          'junk',
        ],
      }),
    ).toEqual([{ id: 'a', name: 'Ok', colors: ['#000000'] }]);
  });
});
