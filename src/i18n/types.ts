import type { en } from './en';

type Widen<T> = { readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/** Shape every language must implement — derived from the English reference. */
export type Dictionary = Widen<typeof en>;

type Paths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Paths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Every valid translation key, e.g. `"settings.theme"`. */
export type TKey = Paths<Dictionary>;

export type TParams = Readonly<Record<string, string | number>>;

export type TFunction = (key: TKey, params?: TParams) => string;
