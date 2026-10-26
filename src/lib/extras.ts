// Contenus optionnels d'une fiche produit, détectés au build :
// - vidéo portée : public/videos/<id>.mp4 (ou .webm)
// - rotation 360° : public/images/spin/<id>/01.webp, 02.webp… (une photo tous les 10 à 15°)
// - avis clients : src/data/reviews.json (vide tant qu'aucun vrai avis n'a été reçu)
import fs from 'node:fs';
import path from 'node:path';
import reviews from '../data/reviews.json';

const PUBLIC = path.resolve(process.cwd(), 'public');

export interface Review {
  product: string;
  author: string;
  rating: number;
  title?: string;
  text: string;
  size?: string;
  /** -1 taille petit, 0 taille bien, 1 taille grand */
  fit?: number;
  date: string;
  verified?: boolean;
}

export function productVideo(id: string) {
  const base = id.toLowerCase();
  const file = ['mp4', 'webm'].map((e) => `videos/${base}.${e}`).find((f) => fs.existsSync(path.join(PUBLIC, f)));
  return file ? `/${file}` : null;
}

export function spinFrames(id: string) {
  const dir = path.join(PUBLIC, 'images', 'spin', id.toLowerCase());
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(webp|jpe?g|png|avif)$/i.test(f))
    .sort()
    .map((f) => `/images/spin/${id.toLowerCase()}/${f}`);
}

export function productReviews(id: string) {
  const list = (reviews as Review[]).filter((r) => r.product === id).sort((a, b) => b.date.localeCompare(a.date));
  const count = list.length;
  const average = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
  const fits = list.filter((r) => typeof r.fit === 'number');
  const fit = fits.length ? fits.reduce((s, r) => s + (r.fit ?? 0), 0) / fits.length : null;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: list.filter((r) => Math.round(r.rating) === n).length }));
  return { list, count, average, fit, dist };
}

/** Taille du modèle, au format de la langue. */
export function modelHeight(cm: number, locale: 'fr' | 'en') {
  const m = (cm / 100).toFixed(2);
  if (locale === 'fr') return `${m.replace('.', ',')} m`;
  const inches = Math.round(cm / 2.54);
  return `${m} m (${Math.floor(inches / 12)}′${inches % 12}″)`;
}

/** « ★★★★☆ » pour une note sur 5 (arrondie au demi-point inférieur). */
export function starText(n: number) {
  const full = Math.min(5, Math.floor(n + 0.25));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}
