import { describe, expect, it as test } from 'vitest';
import { en } from './en';
import { it } from './it';
import { createTranslator, detectLanguage, interpolate } from './translate';

function keyPaths(node: unknown, prefix = ''): string[] {
  if (typeof node === 'string') return [prefix];
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    keyPaths(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe('i18n dictionaries', () => {
  test('Italian has exactly the same keys as English', () => {
    expect(keyPaths(it).sort()).toEqual(keyPaths(en).sort());
  });

  test('no translation is empty', () => {
    for (const dict of [en, it]) {
      const values = keyPaths(dict).map((path) => createTranslator('en')(path as never));
      expect(values.every((v) => v.trim().length > 0)).toBe(true);
    }
  });

  test('placeholders match between languages', () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    const tEn = createTranslator('en');
    const tIt = createTranslator('it');
    for (const path of keyPaths(en)) {
      expect(placeholders(tIt(path as never)), path).toEqual(placeholders(tEn(path as never)));
    }
  });
});

describe('createTranslator', () => {
  test('translates nested keys per language', () => {
    expect(createTranslator('en')('nav.settings')).toBe('Settings');
    expect(createTranslator('it')('nav.settings')).toBe('Impostazioni');
  });

  test('interpolates parameters', () => {
    expect(createTranslator('en')('footer.rights', { year: 2026, brand: 'X' })).toBe('© 2026 X');
  });
});

describe('interpolate', () => {
  test('leaves unknown placeholders untouched', () => {
    expect(interpolate('Hi {name} {missing}', { name: 'Ada' })).toBe('Hi Ada {missing}');
  });
});

describe('detectLanguage', () => {
  test('matches base language tags', () => {
    expect(detectLanguage(['it-IT', 'en-US'])).toBe('it');
    expect(detectLanguage(['fr-FR', 'en-GB'])).toBe('en');
  });

  test('falls back to English', () => {
    expect(detectLanguage(['de-DE'])).toBe('en');
    expect(detectLanguage([])).toBe('en');
  });
});
