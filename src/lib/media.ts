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
}

const EN_ALT: Record<string, string> = {
  'hero/desktop': 'Love Over Everything T-shirt, back view, on a raspberry background',
  'hero/mobile': 'Love Over Everything T-shirt, back view, on a raspberry background',
  'categories/t-shirts': 'The Drop 01 t-shirts',
  'categories/maille': 'The Camo knit sweater',
  'categories/love': 'The Love Over Everything T-shirt',
  'story/1': 'Close-up of the embroidered monogram',
  'story/2': 'The Drop 01 pieces laid flat on a raspberry background',
  'story/3': 'Detail of the jacquard knit',
  'texture/gravel': 'Gravel in the sun',
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
      return { src: `/${rel}`, alt: alt ?? spec.alt, width: spec.w, height: spec.h, placeholder: false };
    }
  }
  return { src: `/ph/${encodeKey(key)}.webp`, alt: alt ?? spec.alt, width: spec.w, height: spec.h, placeholder: true };
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
