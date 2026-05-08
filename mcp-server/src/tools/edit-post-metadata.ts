import { z } from "zod";
import { apiRequest, toolResponse } from "../utils/api-client.js";
import { validatePost } from "../utils/validate-post.js";
import { triggerRevalidate } from "../utils/revalidate.js";

export const editPostMetadataTool = {
  name: "edit-post-metadata",
  description:
    "Edit the metadata or body of an existing blog post. Validates content before saving.",
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
    // Validate updated fields before saving
    const errors = validatePost({
      title: updates.title as string | undefined,
      description: updates.description as string | undefined,
      category: updates.category as string | undefined,
      tags: updates.tags as string[] | undefined,
      body: updates.body as string | undefined,
    });
    if (errors.length > 0) {
      return toolResponse(
        {
          error: "Validation failed",
          issues: errors,
          hint: "Fix the issues above and retry.",
        },
        true,
      );
    }

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

    const revalidated = await triggerRevalidate(slug, locale);
    return toolResponse({
      ...(data as Record<string, unknown>),
      _revalidated: revalidated,
    });
  },
};
