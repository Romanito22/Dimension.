// Vidéos TikTok affichées sur l'accueil : colle les liens dans src/data/tiktok.json.
// La miniature vient de public/images/tiktok/<id>.jpg si elle existe, sinon de TikTok
// (récupérée au build), sinon d'un visuel du site.
import fs from 'node:fs';
import path from 'node:path';
import data from '../data/tiktok.json';
import { media } from './media';

interface Entry {
  url: string;
  caption?: string;
}
export interface TikTokVideo {
  id: string;
  url: string;
  caption: string;
  cover: string;
}

const PUBLIC = path.resolve(process.cwd(), 'public');
const idOf = (url: string) => url.match(/video\/(\d+)/)?.[1] ?? null;

async function oembed(url: string) {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return (await res.json()) as { title?: string; thumbnail_url?: string };
  } catch {
    return null;
  }
}

let cache: Promise<TikTokVideo[]> | null = null;
export function tiktokVideos() {
  cache ??= Promise.all(
    (data.videos as Entry[]).map(async (v, i) => {
      const id = idOf(v.url);
      if (!id) return null;
      const local = ['jpg', 'jpeg', 'webp', 'png'].map((e) => `images/tiktok/${id}.${e}`).find((f) => fs.existsSync(path.join(PUBLIC, f)));
      const meta = local && v.caption ? null : await oembed(v.url);
      return {
        id,
        url: v.url,
        caption: v.caption ?? meta?.title ?? '',
        cover: local ? `/${local}` : (meta?.thumbnail_url ?? media(`social/${(i % 6) + 1}`).src),
      };
    }),
  ).then((list) => list.filter(Boolean) as TikTokVideo[]);
  return cache;
}
