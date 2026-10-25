import products from '../data/products.json';
import brand from '../data/brand.json';

export type Product = (typeof products)[number];

export const CATEGORIES = [
  { slug: 't-shirts', label: 'T-shirts' },
  { slug: 'maille', label: 'Maille' },
] as const;

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const LOW_STOCK = 3;

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const eurRound = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function formatPrice(n: number) {
  return Number.isInteger(n) ? eurRound.format(n) : eur.format(n);
}

export function categoryLabel(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function totalStock(p: Product) {
  return p.sizes.reduce((s, x) => s + x.stock, 0);
}

export function availableSizes(p: Product) {
  return p.sizes.filter((s) => s.stock > 0).map((s) => s.size);
}

export function byNewest(list: Product[]) {
  return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

export function related(p: Product, n = 4) {
  return byNewest(products.filter((x) => x.id !== p.id)).slice(0, n);
}

export function imageKeys(p: Product) {
  const base = `products/${p.id.toLowerCase()}`;
  return [1, 2, 3, 4].map((i) => `${base}-${i}`);
}

export function shippingFor(subtotal: number, methodId = 'relay') {
  const m = brand.shipping.methods.find((x) => x.id === methodId) ?? brand.shipping.methods[0];
  if (subtotal >= brand.shipping.freeThreshold && m.id !== 'express') return 0;
  return m.price;
}

export { products, brand };
