import { z } from "zod";
import { apiRequest, toolResponse } from "../utils/api-client.js";

export const getPostTool = {
  name: "get-post",
  description:
    "Read a single blog post's metadata and body content by slug and locale.",
  inputSchema: z.object({
    slug: z.string().describe("The post slug"),
    locale: z.enum(["ko", "en"]).default("ko").describe("Locale of the post"),
  }),
  handler: async ({ slug, locale }: { slug: string; locale: string }) => {
    const { data, error } = await apiRequest(`/posts/${slug}`, {
      params: { locale },
    });

    if (error) return toolResponse({ error }, true);
    return toolResponse(data);
  },
};
