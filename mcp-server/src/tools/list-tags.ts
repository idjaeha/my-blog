import { z } from "zod";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import matter from "gray-matter";

export const listTagsTool = {
  name: "list-tags",
  description: "Aggregate all tags across blog posts with occurrence counts.",
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

      const tagCounts = new Map<string, number>();

      for (const file of mdxFiles) {
        const raw = await readFile(join(dirPath, file), "utf-8");
        const { data } = matter(raw);

        if (Array.isArray(data.tags)) {
          for (const tag of data.tags) {
            const t = String(tag);
            tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
          }
        }
      }

      const tags = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ total: tags.length, tags }, null, 2),
          },
        ],
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error listing tags";
      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ error: message }) },
        ],
        isError: true,
      };
    }
  },
};
