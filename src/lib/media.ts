// Résout une image : la vraie photo si elle existe dans /public/images,
// sinon le visuel provisoire généré (/ph/*.webp, rendu depuis un SVG au build).
import fs from 'node:fs';
import path from 'node:path';
import { SPECS, encodeKey } from './placeholder';

const EXTENSIONS = ['webp', 'jpg', 'jpeg', 'png', 'avif'];
const PUBLIC = path.resolve(process.cwd(), 'public');

export interface Media {
  src: string;
  alt: string;
  width: number;
  height: number;
  placeholder: boolean;
}

export function media(key: string, alt?: string): Media {
  const spec = SPECS[key];
  if (!spec) throw new Error(`Visuel inconnu : ${key}`);
  for (const ext of EXTENSIONS) {
    const rel = `images/${key}.${ext}`;
    if (fs.existsSync(path.join(PUBLIC, rel))) {
      return { src: `/${rel}`, alt: alt ?? spec.alt, width: spec.w, height: spec.h, placeholder: false };
    }
  }
  return { src: `/ph/${encodeKey(key)}.webp`, alt: alt ?? spec.alt, width: spec.w, height: spec.h, placeholder: true };
}

export function brandAsset(name: string): string | null {
  for (const ext of ['svg', 'png', 'webp']) {
    if (fs.existsSync(path.join(PUBLIC, 'brand', `${name}.${ext}`))) return `/brand/${name}.${ext}`;
  }
  return null;
}
