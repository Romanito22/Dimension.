// Catalogue côté client : lu depuis le JSON embarqué dans chaque page (Base.astro).
export interface CatalogItem {
  id: string;
  slug: string;
  name: string;
  short: string;
  price: number;
  category: string;
  color: string;
  image: string;
  hover: string;
  url: string;
  badge: string;
  /** Date de sortie (AAAA-MM-JJ) */
  date: string;
  sizes: { size: string; stock: number }[];
}

let cache: CatalogItem[] | null = null;

export function catalog(): CatalogItem[] {
  if (cache && document.getElementById('catalog')) return cache;
  const el = document.getElementById('catalog');
  cache = el ? (JSON.parse(el.textContent || '[]') as CatalogItem[]) : [];
  return cache;
}

export const byId = (id: string) => catalog().find((p) => p.id === id);
export const stockOf = (p: CatalogItem) => p.sizes.reduce((n, s) => n + s.stock, 0);

/** Normalise pour une recherche insensible à la casse et aux accents. */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
