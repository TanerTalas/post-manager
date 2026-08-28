import { en, type StringKey } from './en';
import { tr } from './tr';
import type { Lang } from './routing';

export { LANGS, LANG_LABEL, DEFAULT_LANG, localePaths, langFrom, to, routeOf, alternateOf, otherLang } from './routing';
export type { Lang } from './routing';
export type { StringKey } from './en';

const DICTIONARIES: Record<Lang, Record<StringKey, string>> = { en, tr };

export type Translate = (key: StringKey, values?: Record<string, string | number>) => string;

/**
 * Returns the lookup for one language. Handed to islands as a prop rather than
 * read from a module level global: islands hydrate independently, and a global
 * set during the build would leak from one page's render into the next.
 */
export function translator(lang: Lang): Translate {
  const dictionary = DICTIONARIES[lang];

  return (key, values) => {
    const text = dictionary[key];
    if (!values) return text;
    return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
      name in values ? String(values[name]) : whole,
    );
  };
}

export { en, tr };
