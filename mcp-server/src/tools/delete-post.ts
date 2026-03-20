import { z } from "zod";
import { apiRequest, toolResponse } from "../utils/api-client.js";

export const deletePostTool = {
  name: "delete-post",
  description: "Soft-delete a blog post by archiving it.",
  inputSchema: z.object({
    slug: z.string().describe("The post slug"),
    locale: z.enum(["ko", "en"]).default("ko").describe("Locale of the post"),
  }),
  handler: async ({ slug, locale }: { slug: string; locale: string }) => {
    const { data, error } = await apiRequest(`/posts/${slug}`, {
      method: "DELETE",
      params: { locale },
    });

    if (error) return toolResponse({ error }, true);
    return toolResponse(data);
  },
};
