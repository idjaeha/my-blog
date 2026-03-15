import { z } from "zod";
import { writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import matter from "gray-matter";

export const createPostTool = {
  name: "create-post",
  description: "Create a new MDX blog post with frontmatter.",
  inputSchema: z.object({
    slug: z.string().describe("The post slug (used as filename)"),
    title: z.string().describe("Post title"),
    description: z.string().describe("Post description/summary"),
    category: z.string().describe("Post category"),
    locale: z
      .enum(["ko", "en"])
      .default("ko")
      .describe("Locale directory to create in"),
    tags: z.array(z.string()).optional().describe("Post tags"),
    draft: z.boolean().default(true).describe("Whether the post is a draft"),
    body: z.string().optional().describe("MDX body content"),
    series: z.string().optional().describe("Series name if part of a series"),
    seriesOrder: z
      .number()
      .int()
      .optional()
      .describe("Order within the series"),
    coverImage: z
      .string()
      .optional()
      .describe(
        "Relative path to cover image (e.g. '../../../assets/images/blog/my-post-cover.png')",
      ),
  }),
  handler: async ({
    slug,
    title,
    description,
    category,
    locale,
    tags,
    draft,
    body,
    series,
    seriesOrder,
    coverImage,
  }: {
    slug: string;
    title: string;
    description: string;
    category: string;
    locale: string;
    tags?: string[];
    draft: boolean;
    body?: string;
    series?: string;
    seriesOrder?: number;
    coverImage?: string;
  }) => {
    const contentDir = resolve(
      process.cwd(),
      process.env.BLOG_CONTENT_DIR || "src/content/blog",
    );
    const filePath = join(contentDir, locale, `${slug}.mdx`);

    try {
      // Check if file already exists
      try {
        await access(filePath);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: `Post already exists at ${locale}/${slug}.mdx`,
              }),
            },
          ],
          isError: true,
        };
      } catch {
        // File does not exist, proceed
      }

      const now = new Date();
      const kstOffset = 9 * 60;
      const kst = new Date(
        now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000,
      );
      const today = `${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(2, "0")}-${String(kst.getDate()).padStart(2, "0")}T${String(kst.getHours()).padStart(2, "0")}:${String(kst.getMinutes()).padStart(2, "0")}:${String(kst.getSeconds()).padStart(2, "0")}+09:00`;

      const frontmatter: Record<string, unknown> = {
        title,
        description,
        category,
        tags: tags ?? [],
        publishedDate: today,
        draft,
      };

      if (series) frontmatter.series = series;
      if (seriesOrder !== undefined) frontmatter.seriesOrder = seriesOrder;
      if (coverImage) frontmatter.coverImage = coverImage;

      const fileContent = matter.stringify(body ?? "", frontmatter);

      await writeFile(filePath, fileContent, "utf-8");

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              created: `${locale}/${slug}.mdx`,
              frontmatter,
            }),
          },
        ],
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error creating post";
      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ error: message }) },
        ],
        isError: true,
      };
    }
  },
};
