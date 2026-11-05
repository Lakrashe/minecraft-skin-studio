import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_LANGUAGE, detectLanguage, isLanguage, type Language } from '@/i18n';
import { browserLocalStorage, createResilientStorage } from './resilient-storage';

export const THEME_PREFERENCES = ['dark', 'light', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const MOTION_PREFERENCES = ['system', 'reduced', 'full'] as const;
export type MotionPreference = (typeof MOTION_PREFERENCES)[number];

export const ACCENT_PRESETS = [
  { id: 'emerald', hex: '#4fd16b' },
  { id: 'diamond', hex: '#3fd5e0' },
  { id: 'lapis', hex: '#5b84f5' },
  { id: 'amethyst', hex: '#a78bfa' },
  { id: 'redstone', hex: '#f0504a' },
  { id: 'copper', hex: '#e8834a' },
  { id: 'gold', hex: '#f2c94c' },
] as const;
export type AccentPresetId = (typeof ACCENT_PRESETS)[number]['id'];

export const DEFAULT_ACCENT = ACCENT_PRESETS[0].hex;

/** Storage key — neutral prefix so it survives the brand rename (decision D2). */
export const SETTINGS_STORAGE_KEY = 'mss.settings';
const SETTINGS_VERSION = 1;

export interface SettingsValues {
  readonly theme: ThemePreference;
  readonly accent: string;
  readonly language: Language;
  readonly motion: MotionPreference;
}

interface SettingsActions {
  setTheme: (theme: ThemePreference) => void;
  setAccent: (hex: string) => void;
  setLanguage: (language: Language) => void;
  setMotion: (motion: MotionPreference) => void;
  reset: () => void;
}

export type SettingsState = SettingsValues & SettingsActions;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value);
}

function initialLanguage(): Language {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;
  return detectLanguage(navigator.languages);
}

export function defaultSettings(): SettingsValues {
  return { theme: 'dark', accent: DEFAULT_ACCENT, language: initialLanguage(), motion: 'system' };
}

const oneOf =
  <T extends string>(options: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === 'string' && (options as readonly string[]).includes(value);

const isTheme = oneOf(THEME_PREFERENCES);
const isMotion = oneOf(MOTION_PREFERENCES);

/**
 * Persisted data is external input: keep only valid fields, fall back to
 * defaults for everything else (PROJECT_RULES §1.5).
 */
export function sanitizeSettings(raw: unknown, fallback: SettingsValues): SettingsValues {
  if (typeof raw !== 'object' || raw === null) return fallback;
  const r = raw as Record<string, unknown>;
  return {
    theme: isTheme(r['theme']) ? r['theme'] : fallback.theme,
    accent: isHexColor(r['accent']) ? r['accent'].toLowerCase() : fallback.accent,
    language: isLanguage(r['language']) ? r['language'] : fallback.language,
    motion: isMotion(r['motion']) ? r['motion'] : fallback.motion,
  };
}

// Never throws: storage failures fall back to memory and flip usePersistenceStatus.
const settingsStorage = createResilientStorage(browserLocalStorage);

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings(),
      setTheme: (theme) => {
        set({ theme });
      },
      setAccent: (hex) => {
        if (isHexColor(hex)) set({ accent: hex.toLowerCase() });
      },
      setLanguage: (language) => {
        set({ language });
      },
      setMotion: (motion) => {
        set({ motion });
      },
      reset: () => {
        set(defaultSettings());
      },
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: SETTINGS_VERSION,
      storage: createJSONStorage(() => settingsStorage),
      partialize: ({ theme, accent, language, motion }): SettingsValues => ({
        theme,
        accent,
        language,
        motion,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitizeSettings(persisted, current) }),
    },
  ),
);
