import { z } from "zod";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import matter from "gray-matter";

export const listCategoriesTool = {
  name: "list-categories",
  description:
    "Aggregate all categories across blog posts with occurrence counts.",
  inputSchema: z.object({
    locale: z
      .enum(["ko", "en"])
      .default("ko")
      .describe("Locale directory to scan"),
  }),
  handler: async ({ locale }: { locale: string }) => {
    const contentDir = resolve(
      process.cwd(),
      process.env.BLOG_CONTENT_DIR || "src/content/blog",
    );
    const dirPath = join(contentDir, locale);

    try {
      const files = await readdir(dirPath);
      const mdxFiles = files.filter((f) => f.endsWith(".mdx"));

      const categoryCounts = new Map<string, number>();

      for (const file of mdxFiles) {
        const raw = await readFile(join(dirPath, file), "utf-8");
        const { data } = matter(raw);

        if (data.category) {
          const cat = String(data.category);
          categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
        }
      }

      const categories = Array.from(categoryCounts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { total: categories.length, categories },
              null,
              2,
            ),
          },
        ],
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error listing categories";
      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ error: message }) },
        ],
        isError: true,
      };
    }
  },
};
