import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { browserLocalStorage, createResilientStorage } from './resilient-storage';

/** User-made color palettes, saved on this device. */
export interface CustomPalette {
  readonly id: string;
  readonly name: string;
  /** Lowercase `#rrggbb` or `#rrggbbaa`. */
  readonly colors: readonly string[];
}

export const PALETTES_STORAGE_KEY = 'mss.palettes';
export const MAX_PALETTES = 24;
export const MAX_PALETTE_COLORS = 64;
export const MAX_PALETTE_NAME = 40;

const HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/;

export function isPaletteColor(value: unknown): value is string {
  return typeof value === 'string' && HEX.test(value);
}

interface PaletteActions {
  /** Creates a palette (optionally seeded with colors) and returns its id, or `null` at the limit. */
  createPalette: (name: string, colors?: readonly string[]) => string | null;
  renamePalette: (id: string, name: string) => void;
  deletePalette: (id: string) => void;
  /** Adds a color unless it is already there or the palette is full. */
  addColor: (id: string, color: string) => void;
  removeColor: (id: string, color: string) => void;
}

export interface PalettesState extends PaletteActions {
  readonly palettes: readonly CustomPalette[];
}

const cleanName = (name: string) => name.trim().slice(0, MAX_PALETTE_NAME);

let counter = 0;
const newId = () => `p${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Persisted palettes are external input: keep only valid entries. */
export function sanitizePalettes(raw: unknown): CustomPalette[] {
  if (typeof raw !== 'object' || raw === null) return [];
  const list = (raw as Record<string, unknown>)['palettes'];
  if (!Array.isArray(list)) return [];
  const out: CustomPalette[] = [];
  const ids = new Set<string>();
  for (const item of list.slice(0, MAX_PALETTES)) {
    if (typeof item !== 'object' || item === null) continue;
    const p = item as Record<string, unknown>;
    const id = p['id'];
    const name = p['name'];
    const colors = p['colors'];
    if (typeof id !== 'string' || id === '' || ids.has(id) || typeof name !== 'string') continue;
    if (!Array.isArray(colors)) continue;
    ids.add(id);
    out.push({
      id,
      name: cleanName(name),
      colors: [...new Set(colors.filter(isPaletteColor))].slice(0, MAX_PALETTE_COLORS),
    });
  }
  return out;
}

const storage = createResilientStorage(browserLocalStorage);

export const usePalettes = create<PalettesState>()(
  persist(
    (set, get) => {
      const update = (id: string, fn: (p: CustomPalette) => CustomPalette) => {
        set((s) => ({ palettes: s.palettes.map((p) => (p.id === id ? fn(p) : p)) }));
      };
      return {
        palettes: [],
        createPalette: (name, colors = []) => {
          if (get().palettes.length >= MAX_PALETTES) return null;
          const id = newId();
          const palette: CustomPalette = {
            id,
            name: cleanName(name),
            colors: [...new Set(colors.filter(isPaletteColor))].slice(0, MAX_PALETTE_COLORS),
          };
          set((s) => ({ palettes: [...s.palettes, palette] }));
          return id;
        },
        renamePalette: (id, name) => {
          update(id, (p) => ({ ...p, name: cleanName(name) }));
        },
        deletePalette: (id) => {
          set((s) => ({ palettes: s.palettes.filter((p) => p.id !== id) }));
        },
        addColor: (id, color) => {
          const value = color.toLowerCase();
          if (!isPaletteColor(value)) return;
          update(id, (p) =>
            p.colors.includes(value) || p.colors.length >= MAX_PALETTE_COLORS
              ? p
              : { ...p, colors: [...p.colors, value] },
          );
        },
        removeColor: (id, color) => {
          update(id, (p) => ({ ...p, colors: p.colors.filter((c) => c !== color.toLowerCase()) }));
        },
      };
    },
    {
      name: PALETTES_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => storage),
      partialize: ({ palettes }) => ({ palettes }),
      merge: (persisted, current) => ({ ...current, palettes: sanitizePalettes(persisted) }),
    },
  ),
);
