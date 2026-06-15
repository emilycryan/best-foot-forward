import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';
import { entrySchema } from './lib/entry-schema';

const entries = defineCollection({
  // `[^_]` skips files beginning with `_` (templates/drafts-in-waiting).
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/entries' }),
  schema: entrySchema,
});

const protocols = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/protocols' }),
  schema: z.object({
    showTimeline: z.boolean().default(true),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
  }),
});

export const collections = { entries, protocols };
