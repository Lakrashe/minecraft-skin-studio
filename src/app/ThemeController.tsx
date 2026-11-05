import { useEffect } from 'react';
import { useSettings } from '@/state';
import { readableTextOn } from '@/ui';
import { resolveMotion, resolveTheme, useMediaQuery } from './theme';

/**
 * Applies settings to <html>: theme, accent color, motion preference and
 * language. index.html runs an inline script doing the same before first
 * paint to avoid a theme flash.
 */
export function ThemeController() {
  const { theme, accent, motion, language } = useSettings();
  const prefersLight = useMediaQuery('(prefers-color-scheme: light)');
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  const resolvedTheme = resolveTheme(theme, prefersLight);

  // Switch themes instantly: per-element color transitions would otherwise
  // make controls fade at different speeds.
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset['theme'] === resolvedTheme) return;
    root.dataset['themeSwitching'] = '';
    root.dataset['theme'] = resolvedTheme;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        delete root.dataset['themeSwitching'];
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      delete root.dataset['themeSwitching'];
    };
  }, [resolvedTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset['motion'] = resolveMotion(motion, prefersReduced);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-contrast', readableTextOn(accent));
    root.lang = language;
  }, [accent, motion, language, prefersReduced]);

  return null;
}
