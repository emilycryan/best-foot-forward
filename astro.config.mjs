import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';

// `site` is used for canonical URLs, sitemap, and RSS.
export default defineConfig({
  site: 'https://best-foot-forward-eight.vercel.app',
  integrations: [sitemap(), pagefind()],
});
