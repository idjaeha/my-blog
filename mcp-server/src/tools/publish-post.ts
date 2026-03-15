import { z } from "zod";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { nowKST, fixFrontmatterDates } from "../utils/date";

export const publishPostTool = {
  name: "publish-post",
  description:
    "Publish a draft blog post by setting draft to false and updating the published date.",
  inputSchema: z.object({
    slug: z.string().describe("The post slug"),
    locale: z.enum(["ko", "en"]).default("ko").describe("Locale directory"),
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
      fixFrontmatterDates(data);

      const wasDraft = Boolean(data.draft);

      data.draft = false;
      if (wasDraft) {
        data.publishedDate = nowKST();
      }

      const fileContent = matter.stringify(content, data);
      await writeFile(filePath, fileContent, "utf-8");

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              published: `${locale}/${slug}.mdx`,
              wasDraft,
              publishedDate: data.publishedDate,
            }),
          },
        ],
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error publishing post";
      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ error: message }) },
        ],
        isError: true,
      };
    }
  },
};
