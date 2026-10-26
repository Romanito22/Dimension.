import rawProducts from '../data/products.json';
import rawBrand from '../data/brand.json';
import { localize, intlLocale, type Locale } from '../i18n';

export type Product = Omit<(typeof rawProducts)[number], 'en'>;

export const CATEGORIES = [
  { slug: 't-shirts', label: 'T-shirts', en: 'T-shirts' },
  { slug: 'maille', label: 'Maille', en: 'Knitwear' },
] as const;

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const LOW_STOCK = 3;

/** Catalogue et textes de marque dans la langue de la page. */
export const getProducts = (locale: Locale = 'fr'): Product[] => rawProducts.map((p) => localize(p, locale));
export const getBrand = (locale: Locale = 'fr') => localize(rawBrand, locale);

// Catalogue par défaut (français), utilisé là où la langue n'importe pas (stock, visuels).
export const products = getProducts('fr');
export const brand = getBrand('fr');

const formats = new Map<string, Intl.NumberFormat>();
export function formatPrice(n: number, locale: Locale = 'fr') {
  const key = `${locale}-${Number.isInteger(n)}`;
  if (!formats.has(key)) {
    formats.set(
      key,
      new Intl.NumberFormat(intlLocale(locale), {
        style: 'currency',
        currency: 'EUR',
        ...(Number.isInteger(n) ? { maximumFractionDigits: 0 } : {}),
      }),
    );
  }
  return formats.get(key)!.format(n);
}

export function categoryLabel(slug: string, locale: Locale = 'fr') {
  const c = CATEGORIES.find((x) => x.slug === slug);
  return c ? (locale === 'en' ? c.en : c.label) : slug;
}

const BADGES: Record<string, string> = { Nouveau: 'New', 'Best-seller': 'Best-seller', 'Édition limitée': 'Limited edition', Épuisé: 'Sold out' };
export const badgeLabel = (badge: string, locale: Locale = 'fr') => (locale === 'en' ? (BADGES[badge] ?? badge) : badge);

export function totalStock(p: Product) {
  return p.sizes.reduce((s, x) => s + x.stock, 0);
}

export function availableSizes(p: Product) {
  return p.sizes.filter((s) => s.stock > 0).map((s) => s.size);
}

export function byNewest<T extends Product>(list: T[]) {
  return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

export function related<T extends Product>(p: T, list: T[], n = 4) {
  return byNewest(list.filter((x) => x.id !== p.id)).slice(0, n);
}

export function imageKeys(p: Pick<Product, 'id'>) {
  const base = `products/${p.id.toLowerCase()}`;
  return [1, 2, 3, 4].map((i) => `${base}-${i}`);
}

export function shippingFor(subtotal: number, methodId = 'relay') {
  const m = brand.shipping.methods.find((x) => x.id === methodId) ?? brand.shipping.methods[0];
  if (subtotal >= brand.shipping.freeThreshold && m.id !== 'express') return 0;
  return m.price;
}
