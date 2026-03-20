import { z } from "zod";
import { apiRequest, toolResponse } from "../utils/api-client.js";

export const editPostMetadataTool = {
  name: "edit-post-metadata",
  description: "Edit the metadata of an existing blog post.",
  inputSchema: z.object({
    slug: z.string().describe("The post slug"),
    locale: z.enum(["ko", "en"]).default("ko").describe("Locale of the post"),
    updates: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        draft: z.boolean().optional(),
        body: z.string().optional(),
        coverImage: z.string().optional(),
        series: z.string().optional(),
        seriesOrder: z.number().int().optional(),
      })
      .describe("Fields to update"),
  }),
  handler: async ({
    slug,
    locale,
    updates,
  }: {
    slug: string;
    locale: string;
    updates: Record<string, unknown>;
  }) => {
    // Map camelCase to snake_case for API
    const apiUpdates: Record<string, unknown> = { locale };
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;
      if (key === "coverImage") apiUpdates["cover_image"] = value;
      else if (key === "seriesOrder") apiUpdates["series_order"] = value;
      else apiUpdates[key] = value;
    }
    apiUpdates["updated_date"] = new Date().toISOString();

    const { data, error } = await apiRequest(`/posts/${slug}`, {
      method: "PATCH",
      body: apiUpdates,
    });

    if (error) return toolResponse({ error }, true);
    return toolResponse(data);
  },
};
