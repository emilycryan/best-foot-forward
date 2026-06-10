import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { entrySchema } from './lib/entry-schema';

const entries = defineCollection({
  // `[^_]` skips files beginning with `_` (templates/drafts-in-waiting).
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/entries' }),
  schema: entrySchema,
});

export const collections = { entries };
