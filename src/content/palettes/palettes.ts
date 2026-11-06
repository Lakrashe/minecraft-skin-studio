/**
 * Built-in palettes (original color choices, shipped data). User palettes
 * live in `state/palettes` and are saved on the device.
 */
export type BuiltInPaletteId = 'essentials' | 'skinTones' | 'hair';

export interface BuiltInPalette {
  readonly id: BuiltInPaletteId;
  /** i18n key suffix: `palettes.builtIn.<id>`. */
  readonly colors: readonly string[];
}

export const BUILT_IN_PALETTES: readonly BuiltInPalette[] = [
  {
    id: 'essentials',
    colors: [
      '#000000',
      '#3a3a3a',
      '#7a7a7a',
      '#bdbdbd',
      '#ffffff',
      '#b3312c',
      '#e8834a',
      '#f2c94c',
      '#4fd16b',
      '#2f8f4e',
      '#3fd5e0',
      '#5b84f5',
      '#2c3e8f',
      '#a78bfa',
      '#d660a8',
    ],
  },
  {
    id: 'skinTones',
    colors: [
      '#f6d7c3',
      '#eebd9a',
      '#d9a07a',
      '#c98e66',
      '#b0744d',
      '#8d5a3b',
      '#6b4229',
      '#4a2e1d',
    ],
  },
  {
    id: 'hair',
    colors: [
      '#f3e3a1',
      '#d8b04a',
      '#a8642f',
      '#7a3f1d',
      '#3b2a1e',
      '#1f1712',
      '#c8c8c8',
      '#d65a4a',
    ],
  },
];
