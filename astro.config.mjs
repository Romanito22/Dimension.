import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dimensionbrand.fr',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
});
