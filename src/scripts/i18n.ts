// Traductions côté navigateur : la langue est lue sur <html lang>, à chaque appel
// (le routeur la met à jour en changeant de page).
import { href, type Locale, type RouteKey } from '../i18n';
import { formatPrice } from '../lib/shop';

export const lang = (): Locale => (document.documentElement.lang === 'en' ? 'en' : 'fr');
export const t = <T = string>(fr: T, en: T): T => (lang() === 'en' ? en : fr);
export const price = (n: number) => formatPrice(n, lang());

/** Adresse d'une page ; dans la démo statique (meta dim-root) on vise les fichiers .html. */
export function localPath(path: string) {
  const root = document.querySelector<HTMLMetaElement>('meta[name="dim-root"]')?.content;
  if (root === undefined) return path;
  const [base, rest = ''] = path.split(/(?=[?#])/);
  const clean = base.replace(/^\//, '').replace(/\/$/, '');
  return root + (clean === '' ? 'accueil' : clean) + '.html' + rest;
}
export const link = (key: RouteKey, slug = '') => localPath(href(lang(), key, slug));
