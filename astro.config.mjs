import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';

// Open external links (http/https) in a new tab; leave internal links alone.
function rehypeExternalLinksNewTab() {
  return (tree) => {
    const walk = (node) => {
      if (node.type === 'element' && node.tagName === 'a' && /^https?:\/\//i.test(node.properties?.href ?? '')) {
        node.properties.target = '_blank';
        node.properties.rel = ['noopener', 'noreferrer'];
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

// `site` is used for canonical URLs, sitemap, and RSS.
export default defineConfig({
  site: 'https://best-foot-forward-eight.vercel.app',
  integrations: [sitemap(), pagefind()],
  markdown: {
    rehypePlugins: [rehypeExternalLinksNewTab],
  },
});
