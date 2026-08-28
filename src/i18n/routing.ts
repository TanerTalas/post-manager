export const LANGS = ['en', 'tr'] as const;
export type Lang = (typeof LANGS)[number];

/** English sits at the root, so only Turkish carries a prefix. */
export const DEFAULT_LANG: Lang = 'en';

export const LANG_LABEL: Record<Lang, string> = {
  en: 'EN',
  tr: 'TR',
};

/**
 * Both pages of every route are generated from one file. `undefined` is the
 * unprefixed English path; Astro turns the rest parameter into `/tr/...`.
 */
export function localePaths() {
  return [{ params: { lang: undefined } }, { params: { lang: 'tr' } }];
}

export function langFrom(param: string | undefined): Lang {
  return param === 'tr' ? 'tr' : DEFAULT_LANG;
}

/** Builds a path in a given language. `to('/app', 'tr')` gives `/tr/app`. */
export function to(path: string, lang: Lang): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === DEFAULT_LANG) return clean;
  return clean === '/' ? '/tr' : `/tr${clean}`;
}

/** Strips any language prefix, giving the route on its own. */
export function routeOf(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '') || '/';
  if (trimmed === '/tr') return '/';
  return trimmed.startsWith('/tr/') ? trimmed.slice(3) : trimmed;
}

/** The same page in the other language, for the header's language switch. */
export function alternateOf(pathname: string, lang: Lang): string {
  return to(routeOf(pathname), lang === 'en' ? 'tr' : 'en');
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'tr' : 'en';
}
