import { defineConfig } from 'astro/config';

// STATIC_EXPORT=1 : version « hébergeable partout » (GitHub Pages, sous-dossier…),
// pages en .html, puis chemins rendus relatifs par tools/export-static.py.
const staticExport = !!process.env.STATIC_EXPORT;

export default defineConfig({
  site: 'https://dimensionbrand.fr',
  prefetch: staticExport ? false : { prefetchAll: true, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
  // CSS intégré à chaque page : aucun fichier à attendre avant le premier affichage
  build: { inlineStylesheets: 'always', ...(staticExport && { format: 'file' }) },
});
