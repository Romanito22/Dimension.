// Versions réduites des vraies photos (480, 800, 1200 px de large), générées au build :
// chaque écran télécharge la taille dont il a besoin (attribut srcset des images).
import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { SPECS, encodeKey } from '../../lib/placeholder';
import { media, variantWidths } from '../../lib/media';

const PUBLIC = path.resolve(process.cwd(), 'public');
const CACHE = path.resolve(process.cwd(), 'node_modules/.cache/dim-img');

export function getStaticPaths() {
  return Object.keys(SPECS).flatMap((key) => {
    const m = media(key);
    if (m.placeholder) return [];
    return variantWidths(m.src.slice(1)).widths.map((w) => ({ params: { name: `${encodeKey(key)}-w${w}` }, props: { file: m.src.slice(1), w } }));
  });
}

export const GET: APIRoute = async ({ props }) => {
  const { file, w } = props as { file: string; w: number };
  const src = path.join(PUBLIC, file);
  const stat = fs.statSync(src);
  const id = crypto.createHash('sha1').update(`${file}:${stat.size}:${stat.mtimeMs}:${w}`).digest('hex').slice(0, 16);
  const cached = path.join(CACHE, `${id}.webp`);
  let buf: Buffer;
  if (fs.existsSync(cached)) buf = fs.readFileSync(cached);
  else {
    buf = await sharp(src).resize({ width: w }).webp({ quality: 78, alphaQuality: 90, effort: 5 }).toBuffer();
    fs.mkdirSync(CACHE, { recursive: true });
    fs.writeFileSync(cached, buf);
  }
  return new Response(new Uint8Array(buf), { headers: { 'Content-Type': 'image/webp' } });
};
