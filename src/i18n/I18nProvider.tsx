import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createTranslator, DEFAULT_LANGUAGE, type Language } from './translate';
import type { TFunction } from './types';

interface I18nValue {
  readonly language: Language;
  readonly t: TFunction;
}

const I18nContext = createContext<I18nValue>({
  language: DEFAULT_LANGUAGE,
  t: createTranslator(DEFAULT_LANGUAGE),
});

export function I18nProvider({ language, children }: { language: Language; children: ReactNode }) {
  const value = useMemo(() => ({ language, t: createTranslator(language) }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Returns the active language and its translator. */
export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

export function useT(): TFunction {
  return useContext(I18nContext).t;
}
