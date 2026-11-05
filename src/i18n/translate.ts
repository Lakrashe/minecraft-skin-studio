import { en } from './en';
import { it } from './it';
import type { Dictionary, TFunction, TKey, TParams } from './types';

export const LANGUAGES = ['en', 'it'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'en';

const dictionaries: Readonly<Record<Language, Dictionary>> = { en, it };

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/** Best match for the browser's preferred languages, falling back to English. */
export function detectLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLanguage(base)) return base;
  }
  return DEFAULT_LANGUAGE;
}

function lookup(dictionary: Dictionary, key: TKey): string | undefined {
  let node: unknown = dictionary;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

export function createTranslator(language: Language): TFunction {
  const dictionary = dictionaries[language];
  return (key, params) => interpolate(lookup(dictionary, key) ?? lookup(en, key) ?? key, params);
}
