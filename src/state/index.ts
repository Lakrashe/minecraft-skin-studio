export {
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  MOTION_PREFERENCES,
  SETTINGS_STORAGE_KEY,
  THEME_PREFERENCES,
  defaultSettings,
  isHexColor,
  sanitizeSettings,
  useSettings,
  type AccentPresetId,
  type MotionPreference,
  type SettingsState,
  type SettingsValues,
  type ThemePreference,
} from './settings';
export { createResilientStorage, usePersistenceStatus } from './resilient-storage';
export { resolveMotion, useMediaQuery, useReducedMotion, type ResolvedMotion } from './media';
export {
  MAX_PALETTES,
  MAX_PALETTE_COLORS,
  MAX_PALETTE_NAME,
  PALETTES_STORAGE_KEY,
  isPaletteColor,
  sanitizePalettes,
  usePalettes,
  type CustomPalette,
  type PalettesState,
} from './palettes';
