import { z } from "zod";
import { apiRequest, toolResponse } from "../utils/api-client.js";

export const listTagsTool = {
  name: "list-tags",
  description: "List all tags across blog posts with occurrence counts.",
  inputSchema: z.object({
    locale: z.enum(["ko", "en"]).default("ko").describe("Locale to scan"),
  }),
  handler: async ({ locale }: { locale: string }) => {
    const { data, error } = await apiRequest("/tags", {
      params: { locale },
    });

    if (error) return toolResponse({ error }, true);
    return toolResponse(data);
  },
};
