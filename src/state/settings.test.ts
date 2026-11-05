import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_ACCENT,
  defaultSettings,
  isHexColor,
  sanitizeSettings,
  useSettings,
  type SettingsValues,
} from './settings';

const fallback: SettingsValues = {
  theme: 'dark',
  accent: DEFAULT_ACCENT,
  language: 'en',
  motion: 'system',
};

describe('sanitizeSettings', () => {
  it('returns the fallback for non-object input', () => {
    expect(sanitizeSettings(null, fallback)).toEqual(fallback);
    expect(sanitizeSettings('oops', fallback)).toEqual(fallback);
  });

  it('keeps valid fields and normalizes the accent', () => {
    expect(
      sanitizeSettings(
        { theme: 'light', accent: '#ABCDEF', language: 'it', motion: 'reduced' },
        fallback,
      ),
    ).toEqual({ theme: 'light', accent: '#abcdef', language: 'it', motion: 'reduced' });
  });

  it('replaces invalid fields with fallbacks', () => {
    expect(
      sanitizeSettings(
        { theme: 'neon', accent: 'red', language: 'xx', motion: 42, extra: true },
        fallback,
      ),
    ).toEqual(fallback);
  });
});

describe('isHexColor', () => {
  it('accepts only #rrggbb', () => {
    expect(isHexColor('#4fd16b')).toBe(true);
    expect(isHexColor('#FFF')).toBe(false);
    expect(isHexColor('4fd16b')).toBe(false);
    expect(isHexColor(123)).toBe(false);
  });
});

describe('useSettings store', () => {
  beforeEach(() => {
    useSettings.getState().reset();
  });

  it('defaults to the dark theme with the emerald accent', () => {
    const state = useSettings.getState();
    expect(state.theme).toBe('dark');
    expect(state.accent).toBe(DEFAULT_ACCENT);
  });

  it('ignores invalid accent colors', () => {
    useSettings.getState().setAccent('not-a-color');
    expect(useSettings.getState().accent).toBe(DEFAULT_ACCENT);
    useSettings.getState().setAccent('#112233');
    expect(useSettings.getState().accent).toBe('#112233');
  });

  it('reset restores defaults', () => {
    const s = useSettings.getState();
    s.setTheme('light');
    s.setMotion('reduced');
    s.reset();
    const { theme, motion } = useSettings.getState();
    expect({ theme, motion }).toEqual({
      theme: defaultSettings().theme,
      motion: defaultSettings().motion,
    });
  });
});
