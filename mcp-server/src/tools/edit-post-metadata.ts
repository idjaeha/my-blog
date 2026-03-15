import { z } from "zod";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { nowKST, fixFrontmatterDates } from "../utils/date.js";

export const editPostMetadataTool = {
  name: "edit-post-metadata",
  description: "Edit the frontmatter metadata of an existing blog post.",
  inputSchema: z.object({
    slug: z.string().describe("The post slug"),
    locale: z.enum(["ko", "en"]).default("ko").describe("Locale directory"),
    updates: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        draft: z.boolean().optional(),
        coverImage: z.string().optional(),
        series: z.string().optional(),
        seriesOrder: z.number().int().optional(),
      })
      .describe("Fields to update in frontmatter"),
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
    const contentDir = resolve(
      process.cwd(),
      process.env.BLOG_CONTENT_DIR || "src/content/blog",
    );
    const filePath = join(contentDir, locale, `${slug}.mdx`);

    try {
      const raw = await readFile(filePath, "utf-8");
      const { data, content } = matter(raw);
      fixFrontmatterDates(data);

      // Merge updates into existing frontmatter
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          data[key] = value;
        }
      }

      // Set updatedDate
      data.updatedDate = nowKST();

      const fileContent = matter.stringify(content, data);
      await writeFile(filePath, fileContent, "utf-8");

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              updated: `${locale}/${slug}.mdx`,
              frontmatter: data,
            }),
          },
        ],
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error editing post metadata";
      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ error: message }) },
        ],
        isError: true,
      };
    }
  },
};
