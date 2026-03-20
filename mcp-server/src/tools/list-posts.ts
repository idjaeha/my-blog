import { z } from "zod";
import { apiRequest, toolResponse } from "../utils/api-client.js";

export const listPostsTool = {
  name: "list-posts",
  description:
    "List blog posts with optional filtering by locale, category, tag, and draft status.",
  inputSchema: z.object({
    locale: z.enum(["ko", "en"]).default("ko").describe("Locale to filter by"),
    category: z.string().optional().describe("Filter by category"),
    tag: z.string().optional().describe("Filter by tag"),
    draft: z
      .boolean()
      .optional()
      .describe(
        "Filter by draft status (true=drafts only, false=published only)",
      ),
    limit: z.number().int().min(1).default(50).describe("Max posts to return"),
    offset: z.number().int().min(0).default(0).describe("Pagination offset"),
  }),
  handler: async ({
    locale,
    category,
    tag,
    draft,
    limit,
    offset,
  }: {
    locale: string;
    category?: string;
    tag?: string;
    draft?: boolean;
    limit: number;
    offset: number;
  }) => {
    const { data, error } = await apiRequest("/posts", {
      params: {
        locale,
        category,
        tag,
        draft: draft !== undefined ? String(draft) : undefined,
        limit: String(limit),
        offset: String(offset),
      },
    });

    if (error) return toolResponse({ error }, true);
    return toolResponse(data);
  },
};
