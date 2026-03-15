import { z } from "zod";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import matter from "gray-matter";

export const listPostsTool = {
  name: "list-posts",
  description:
    "List blog posts with optional filtering by locale, category, tag, and draft status.",
  inputSchema: z.object({
    locale: z
      .enum(["ko", "en"])
      .default("ko")
      .describe("Locale directory to list from"),
    category: z.string().optional().describe("Filter by category"),
    tag: z.string().optional().describe("Filter by tag"),
    draft: z.boolean().optional().describe("Filter by draft status"),
    limit: z.number().int().min(1).default(20).describe("Max posts to return"),
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
    const contentDir = resolve(
      process.cwd(),
      process.env.BLOG_CONTENT_DIR || "src/content/blog",
    );
    const dirPath = join(contentDir, locale);

    try {
      const files = await readdir(dirPath);
      const mdxFiles = files.filter((f) => f.endsWith(".mdx"));

      const posts: Array<{
        slug: string;
        title: string;
        description: string;
        category: string;
        tags: string[];
        publishedDate: string;
        draft: boolean;
      }> = [];

      for (const file of mdxFiles) {
        const raw = await readFile(join(dirPath, file), "utf-8");
        const { data } = matter(raw);

        const post = {
          slug: file.replace(/\.mdx$/, ""),
          title: data.title ?? "",
          description: data.description ?? "",
          category: data.category ?? "",
          tags: Array.isArray(data.tags) ? data.tags : [],
          publishedDate: data.publishedDate ? String(data.publishedDate) : "",
          draft: Boolean(data.draft),
        };

        // Apply filters
        if (category && post.category !== category) continue;
        if (tag && !post.tags.includes(tag)) continue;
        if (draft !== undefined && post.draft !== draft) continue;

        posts.push(post);
      }

      // Sort by publishedDate descending
      posts.sort((a, b) => {
        if (!a.publishedDate) return 1;
        if (!b.publishedDate) return -1;
        return b.publishedDate.localeCompare(a.publishedDate);
      });

      const paginated = posts.slice(offset, offset + limit);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { total: posts.length, offset, limit, posts: paginated },
              null,
              2,
            ),
          },
        ],
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error listing posts";
      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ error: message }) },
        ],
        isError: true,
      };
    }
  },
};
