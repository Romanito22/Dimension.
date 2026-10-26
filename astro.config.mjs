import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dimensionbrand.fr',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
  // CSS intégré à chaque page : aucun fichier à attendre avant le premier affichage
  build: { inlineStylesheets: 'always' },
});
