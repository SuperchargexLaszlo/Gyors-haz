import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gyors-haz.hu',
  trailingSlash: 'never',
  integrations: [
    sitemap({
      // Az alaprajz tervező egy eszköz a házainkhoz, nem önálló termék:
      // szándékosan nem kérünk rá keresőforgalmat, és a sitemapból is
      // kimarad. Csak a termékoldalakról lehet eljutni hozzá.
      filter: (page) => !page.includes('/alaprajz-rajzolo'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
