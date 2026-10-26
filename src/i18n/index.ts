// Langues du site : le français est servi à la racine, l'anglais sous /en/.
// Les textes restent à côté de leur traduction (t('Boutique', 'Shop')) pour être faciles à relire.
export type Locale = 'fr' | 'en';
export const LOCALES: Locale[] = ['fr', 'en'];

/** Pages du site et leur adresse dans chaque langue. */
export const ROUTES = {
  home: { fr: '/', en: '/en/' },
  shop: { fr: '/boutique', en: '/en/shop' },
  product: { fr: '/produit/', en: '/en/product/' },
  cart: { fr: '/panier', en: '/en/cart' },
  checkout: { fr: '/commande', en: '/en/checkout' },
  wishlist: { fr: '/favoris', en: '/en/wishlist' },
  lookbook: { fr: '/lookbook', en: '/en/lookbook' },
  brand: { fr: '/la-marque', en: '/en/about' },
  contact: { fr: '/contact', en: '/en/contact' },
  track: { fr: '/suivi', en: '/en/track' },
  account: { fr: '/compte', en: '/en/account' },
  terms: { fr: '/cgv', en: '/en/terms' },
  legal: { fr: '/mentions-legales', en: '/en/legal' },
} as const;
export type RouteKey = keyof typeof ROUTES;

export const localeFromPath = (path: string): Locale => (/^\/en(\/|\.html$|$)/.test(path) ? 'en' : 'fr');

export function href(locale: Locale, key: RouteKey, slug = '') {
  return ROUTES[key][locale] + slug;
}

/** Choisit le texte dans la langue courante. */
export const translator =
  (locale: Locale) =>
  <T = string>(fr: T, en: T): T =>
    locale === 'en' ? en : fr;

const isPlain = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
function merge(base: Record<string, unknown>, over: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = isPlain(v) && isPlain(base[k]) ? merge(base[k] as Record<string, unknown>, v) : v;
  return out;
}

/** Applique les champs traduits `en` d'une donnée (produit, FAQ…) quand la page est en anglais. */
export function localize<T extends object>(obj: T, locale: Locale): Omit<T, 'en'> {
  const { en, ...base } = obj as T & { en?: Record<string, unknown> };
  return (locale === 'en' && en ? merge(base, en) : base) as Omit<T, 'en'>;
}

export const intlLocale = (locale: Locale) => (locale === 'en' ? 'en-IE' : 'fr-FR');
