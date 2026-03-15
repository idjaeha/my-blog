import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string().max(100),
    description: z.string().max(300),
    category: z.enum(["til", "retrospective", "article", "tutorial"]),
    tags: z.array(z.string()).default([]),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    coverImage: z.string().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
  }),
});

export const collections = { blog };
