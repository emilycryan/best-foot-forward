import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../site.config';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const all = (await getCollection('entries', (e) => !e.data.draft))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return rss({
    title: site.name,
    description: site.description,
    site: context.site!,
    items: all.map((e) => ({
      title: e.data.title,
      pubDate: e.data.date,
      description: e.data.comparison ?? e.data.title,
      link: `/entries/${e.id}/`,
    })),
  });
}
