import { z } from "zod";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import matter from "gray-matter";

export const getPostTool = {
  name: "get-post",
  description:
    "Read a single blog post's frontmatter and body content by slug and locale.",
  inputSchema: z.object({
    slug: z
      .string()
      .describe("The post slug (filename without .mdx extension)"),
    locale: z
      .enum(["ko", "en"])
      .default("ko")
      .describe("Locale directory to read from"),
  }),
  handler: async ({ slug, locale }: { slug: string; locale: string }) => {
    const contentDir = resolve(
      process.cwd(),
      process.env.BLOG_CONTENT_DIR || "src/content/blog",
    );
    const filePath = join(contentDir, locale, `${slug}.mdx`);

    try {
      const raw = await readFile(filePath, "utf-8");
      const { data, content } = matter(raw);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { ...data, slug, locale, body: content },
              null,
              2,
            ),
          },
        ],
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error reading post";
      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ error: message }) },
        ],
        isError: true,
      };
    }
  },
};
