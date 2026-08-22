import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(['konnyuszerkezetes', 'modulhaz', 'kontenerhoz', 'altalanos']),
    featuredImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().default('Gyors Ház csapata'),
    showPlannerCta: z.boolean().optional(),
  }),
});

export const collections = { blog };
