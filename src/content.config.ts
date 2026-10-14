import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(), description: z.string(),
    category: z.enum(['web', 'ai']),
    tags: z.array(z.string()).default([]),
    cover: z.enum(['web', 'neural', 'sky']).default('web'),
    date: z.coerce.date().optional(), importedAt: z.coerce.date().optional(),
    series: z.literal('sky-takeout').optional(),
    seriesOrder: z.number().int().positive().optional(),
    sourceLabel: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});
export const collections = { notes };
