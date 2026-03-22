import { z } from "zod";
import { apiRequest, toolResponse } from "../utils/api-client.js";
import { validatePost } from "../utils/validate-post.js";

export const createPostTool = {
  name: "create-post",
  description: "Create a new blog post. Validates content before saving.",
  inputSchema: z.object({
    slug: z
      .string()
      .describe("The post slug (lowercase-hyphen, e.g. 'my-first-post')"),
    title: z.string().describe("Post title (max 100 chars)"),
    description: z
      .string()
      .describe("Post description/summary (max 300 chars)"),
    category: z
      .string()
      .describe(
        "Post category: til | retrospective | article | tutorial | infra",
      ),
    locale: z.enum(["ko", "en"]).default("ko").describe("Locale of the post"),
    tags: z
      .array(z.string())
      .optional()
      .describe("Post tags (lowercase-hyphen, max 7)"),
    draft: z.boolean().default(true).describe("Whether the post is a draft"),
    body: z
      .string()
      .optional()
      .describe(
        "Post body content (Markdown, NOT MDX). IMPORTANT: When nesting code blocks, use 4 backticks for outer blocks and 3 for inner blocks to avoid parsing issues.",
      ),
    series: z.string().optional().describe("Series name if part of a series"),
    seriesOrder: z
      .number()
      .int()
      .optional()
      .describe("Order within the series"),
    coverImage: z.string().optional().describe("Cover image URL or path"),
  }),
  handler: async ({
    slug,
    title,
    description,
    category,
    locale,
    tags,
    draft,
    body,
    series,
    seriesOrder,
    coverImage,
  }: {
    slug: string;
    title: string;
    description: string;
    category: string;
    locale: string;
    tags?: string[];
    draft: boolean;
    body?: string;
    series?: string;
    seriesOrder?: number;
    coverImage?: string;
  }) => {
    // Validate before saving
    const errors = validatePost({
      slug,
      title,
      description,
      category,
      tags,
      body,
    });
    if (errors.length > 0) {
      return toolResponse(
        {
          error: "Validation failed",
          issues: errors,
          hint: "Fix the issues above and retry. See server instructions for writing rules.",
        },
        true,
      );
    }

    const { data, error } = await apiRequest("/posts", {
      method: "POST",
      body: {
        slug,
        title,
        description,
        category,
        locale,
        tags: tags ?? [],
        body: body ?? "",
        draft,
        series,
        series_order: seriesOrder,
        cover_image: coverImage,
      },
    });

    if (error) return toolResponse({ error }, true);
    return toolResponse(data);
  },
};
