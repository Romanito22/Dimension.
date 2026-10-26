// Les visuels provisoires sont dessinés en SVG (filtres de tissu, relief du gravier…)
// puis convertis une fois pour toutes en WebP au build : le navigateur n'a plus
// aucun filtre à recalculer pendant le défilement.
import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { SPECS, placeholderKeys, encodeKey, decodeKey } from '../../lib/placeholder';
import { media } from '../../lib/media';

// Largeur de sortie : assez pour un écran Retina sans alourdir la page.
function targetWidth(key: string, w: number) {
  if (key === 'texture/gravel') return 1400;
  if (key.startsWith('social/')) return 600;
  return Math.min(1600, Math.round(w * 1.125));
}

// Cache disque : le rendu ne change que si le générateur ou les données changent.
const CACHE = path.resolve(process.cwd(), 'node_modules/.cache/dim-ph');
const VERSION = crypto
  .createHash('sha1')
  .update(fs.readFileSync(path.resolve(process.cwd(), 'src/lib/placeholder.ts')))
  .update(fs.readFileSync(path.resolve(process.cwd(), 'src/data/products.json')))
  .digest('hex')
  .slice(0, 12);

async function render(key: string) {
  const file = path.join(CACHE, `${encodeKey(key)}-${VERSION}.webp`);
  if (fs.existsSync(file)) return fs.readFileSync(file);
  const spec = SPECS[key];
  const width = targetWidth(key, spec.w);
  const raster = await sharp(Buffer.from(spec.render()), { density: Math.round((72 * width) / spec.w) })
    .resize({ width })
    .png()
    .toBuffer();
  const encode = (quality: number) => sharp(raster).webp({ quality, alphaQuality: 90, effort: 5 }).toBuffer();
  let buf = await encode(80);
  // Le grain du gravier se compresse mal : on baisse un peu la qualité, invisible à l'œil.
  if (buf.length > 160_000) buf = await encode(64);
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(file, buf);
  return buf;
}

export function getStaticPaths() {
  // Seuls les visuels sans vraie photo sont générés
  return placeholderKeys()
    .filter((key) => media(key).placeholder)
    .map((key) => ({ params: { name: encodeKey(key) } }));
}

export const GET: APIRoute = async ({ params }) => {
  const buf = await render(decodeKey(params.name!));
  return new Response(new Uint8Array(buf), { headers: { 'Content-Type': 'image/webp' } });
};
