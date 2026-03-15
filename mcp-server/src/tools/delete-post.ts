import { z } from "zod";
import { rename, mkdir, access } from "node:fs/promises";
import { join, resolve } from "node:path";

export const deletePostTool = {
  name: "delete-post",
  description:
    "Soft-delete a blog post by moving it to the _archive directory.",
  inputSchema: z.object({
    slug: z.string().describe("The post slug"),
    locale: z.enum(["ko", "en"]).default("ko").describe("Locale directory"),
  }),
  handler: async ({ slug, locale }: { slug: string; locale: string }) => {
    const contentDir = resolve(
      process.cwd(),
      process.env.BLOG_CONTENT_DIR || "src/content/blog",
    );
    const srcPath = join(contentDir, locale, `${slug}.mdx`);
    const archiveDir = join(contentDir, "_archive");
    const destPath = join(archiveDir, `${locale}-${slug}.mdx`);

    try {
      // Verify source file exists
      await access(srcPath);

      // Create _archive directory if it does not exist
      await mkdir(archiveDir, { recursive: true });

      // Move file
      await rename(srcPath, destPath);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              archived: `${locale}/${slug}.mdx`,
              destination: `_archive/${locale}-${slug}.mdx`,
            }),
          },
        ],
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error deleting post";
      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ error: message }) },
        ],
        isError: true,
      };
    }
  },
};
