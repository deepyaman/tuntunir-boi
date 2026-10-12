import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One directory per story under src/stories, named `NN-slug`.
// The numeric prefix keeps directories in book order; the id (and URL) is the slug alone.
const stories = defineCollection({
  loader: glob({
    pattern: '*/index.mdx',
    base: './src/stories',
    generateId: ({ entry }) => entry.replace(/^\d+-/, '').replace(/\/index\.mdx$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    titleBn: z.string(),
    order: z.number().int().positive(),
    source: z.object({
      edition: z.string(),
      wikisource: z.string().url(),
      djvuPages: z.tuple([z.number().int(), z.number().int()]),
    }),
  }),
});

export const collections = { stories };
