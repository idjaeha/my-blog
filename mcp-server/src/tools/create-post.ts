import { z } from "zod";
import { apiRequest, toolResponse } from "../utils/api-client.js";

export const createPostTool = {
  name: "create-post",
  description: "Create a new blog post.",
  inputSchema: z.object({
    slug: z.string().describe("The post slug"),
    title: z.string().describe("Post title"),
    description: z.string().describe("Post description/summary"),
    category: z.string().describe("Post category"),
    locale: z.enum(["ko", "en"]).default("ko").describe("Locale of the post"),
    tags: z.array(z.string()).optional().describe("Post tags"),
    draft: z.boolean().default(true).describe("Whether the post is a draft"),
    body: z.string().optional().describe("Post body content (MDX)"),
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
