// Plan du site pour les moteurs de recherche : chaque page dans les deux langues,
// avec le lien vers sa version dans l'autre langue (hreflang).
import type { APIRoute } from 'astro';
import { products } from '../lib/shop';
import { href, type RouteKey } from '../i18n';

const PAGES: RouteKey[] = ['home', 'shop', 'lookbook', 'brand', 'contact', 'terms', 'legal'];

export const GET: APIRoute = ({ site }) => {
  const abs = (p: string) => new URL(p, site).toString();
  const entries = [
    ...PAGES.map((k) => ({ fr: href('fr', k), en: href('en', k) })),
    ...products.map((p) => ({ fr: href('fr', 'product', p.slug), en: href('en', 'product', p.slug) })),
  ];
  const urls = entries
    .flatMap((e) =>
      [e.fr, e.en].map(
        (loc) => `  <url>
    <loc>${abs(loc)}</loc>
    <xhtml:link rel="alternate" hreflang="fr" href="${abs(e.fr)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${abs(e.en)}"/>
  </url>`,
      ),
    )
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
