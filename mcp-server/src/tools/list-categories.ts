import { z } from "zod";
import { apiRequest, toolResponse } from "../utils/api-client.js";

export const listCategoriesTool = {
  name: "list-categories",
  description: "List all categories across blog posts with occurrence counts.",
  inputSchema: z.object({
    locale: z.enum(["ko", "en"]).default("ko").describe("Locale to scan"),
  }),
  handler: async ({ locale }: { locale: string }) => {
    const { data, error } = await apiRequest("/categories", {
      params: { locale },
    });

    if (error) return toolResponse({ error }, true);
    return toolResponse(data);
  },
};
