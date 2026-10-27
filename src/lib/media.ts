// Résout une image : la vraie photo si elle existe dans /public/images,
// sinon le visuel provisoire généré (/ph/*.webp, rendu depuis un SVG au build).
import fs from 'node:fs';
import path from 'node:path';
import { SPECS, encodeKey } from './placeholder';
import products from '../data/products.json';
import { localize, type Locale } from '../i18n';
import { imageKeys } from './shop';

const EXTENSIONS = ['webp', 'jpg', 'jpeg', 'png', 'avif'];
const PUBLIC = path.resolve(process.cwd(), 'public');

export interface Media {
  src: string;
  alt: string;
  width: number;
  height: number;
  placeholder: boolean;
  /** Versions réduites pour le navigateur (vide pour un visuel provisoire) */
  srcset?: string;
  /** Plus petite version : vignettes du panier, de la recherche, des favoris */
  thumb: string;
}

/** Largeurs générées au build pour chaque vraie photo (voir src/pages/img/[name].webp.ts). */
export const WIDTHS = [200, 480, 800, 1200];

/** Dimensions d'une image lues dans son en-tête (WebP, PNG, JPEG), sans dépendance. */
export function imageSize(file: string): { w: number; h: number } | null {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (kind === 'VP8L') {
      const bits = b.readUInt32LE(21);
      return { w: 1 + (bits & 0x3fff), h: 1 + ((bits >> 14) & 0x3fff) };
    }
    if (kind === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  return null;
}

const sizes = new Map<string, { w: number; h: number } | null>();
/** Largeurs réduites disponibles pour un fichier de /public (celles plus petites que l'original). */
export function variantWidths(rel: string) {
  if (!sizes.has(rel)) sizes.set(rel, imageSize(path.join(PUBLIC, rel)));
  const size = sizes.get(rel);
  return { size, widths: size ? WIDTHS.filter((w) => w < size.w * 0.9) : [] };
}
const variantUrl = (key: string, w: number) => `/img/${encodeKey(key)}-w${w}.webp`;

const EN_ALT: Record<string, string> = {
  'hero/desktop': 'Love Over Everything T-shirt, back view, on a raspberry background',
  'hero/mobile': 'Love Over Everything T-shirt, back view, on a raspberry background',
  'categories/t-shirts': 'The Drop 01 t-shirts',
  'categories/maille': 'The Camo knit sweater',
  'categories/love': 'The Love Over Everything T-shirt',
  'story/1': 'Close-up of the embroidered monogram',
  'story/2': 'The Drop 01 pieces laid flat on a raspberry background',
  'story/3': 'Detail of the jacquard knit',
};
const EN_VIEW = ['front view', 'back view', 'print detail', 'embroidery close-up'];

/** Texte alternatif anglais d'un visuel (le français vient de la fiche du visuel). */
function englishAlt(key: string, fallback: string) {
  if (EN_ALT[key]) return EN_ALT[key];
  const m = key.match(/^(products|cutout)\/(dim-\d+)-(\w+)$/);
  if (m) {
    const p = products.find((x) => x.id.toLowerCase() === m[2]);
    const name = p ? localize(p, 'en').name : m[2];
    if (m[1] === 'cutout') return `${name} — ${m[3] === 'back' ? 'back' : 'front'}, cut out`;
    return `${name} — ${EN_VIEW[Number(m[3]) - 1] ?? 'view'}`;
  }
  const look = key.match(/^lookbook\/(\d+)$/);
  if (look) return `Drop 01 lookbook — image ${look[1]}`;
  const social = key.match(/^social\/(\d+)$/);
  if (social) return `@dimensionbrand post ${social[1]}`;
  return fallback;
}

export function media(key: string, alt?: string, locale: Locale = 'fr'): Media {
  const spec = SPECS[key];
  if (!spec) throw new Error(`Visuel inconnu : ${key}`);
  alt ??= locale === 'en' ? englishAlt(key, spec.alt) : undefined;
  for (const ext of EXTENSIONS) {
    const rel = `images/${key}.${ext}`;
    if (fs.existsSync(path.join(PUBLIC, rel))) {
      const { size, widths } = variantWidths(rel);
      const srcset = size && widths.length ? [...widths.map((w) => `${variantUrl(key, w)} ${w}w`), `/${rel} ${size.w}w`].join(', ') : undefined;
      const small = widths.find((w) => w >= 480);
      const thumb = small ? variantUrl(key, small) : `/${rel}`;
      return { src: `/${rel}`, alt: alt ?? spec.alt, width: spec.w, height: spec.h, placeholder: false, srcset, thumb };
    }
  }
  const src = `/ph/${encodeKey(key)}.webp`;
  return { src, alt: alt ?? spec.alt, width: spec.w, height: spec.h, placeholder: true, thumb: src };
}

/** Version d'au moins `min` px de large (la plus légère qui suffit), sinon l'original. */
export function mediaAt(key: string, min: number) {
  const m = media(key);
  if (m.placeholder) return m.src;
  const { widths } = variantWidths(m.src.slice(1));
  const w = widths.find((x) => x >= min);
  return w ? variantUrl(key, w) : m.src;
}

/** Visuels d'une fiche : les vraies photos si la pièce en a, sinon les quatre visuels provisoires. */
export function galleryKeys(p: { id: string }) {
  const keys = imageKeys(p);
  const real = keys.filter((k) => !media(k).placeholder);
  return real.length ? real : keys;
}

export function brandAsset(name: string): string | null {
  for (const ext of ['svg', 'png', 'webp']) {
    if (fs.existsSync(path.join(PUBLIC, 'brand', `${name}.${ext}`))) return `/brand/${name}.${ext}`;
  }
  return null;
}
