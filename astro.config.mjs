import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';

// `site` is used for canonical URLs, sitemap, and RSS.
// Update this to the real domain/Vercel URL after the first deploy.
export default defineConfig({
  site: 'https://best-foot-forward.vercel.app',
  integrations: [sitemap(), pagefind()],
});
