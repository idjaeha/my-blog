import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import matter from "gray-matter";

export interface TestPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags?: string[];
  publishedDate?: string;
  draft?: boolean;
  body?: string;
  series?: string;
  seriesOrder?: number;
}

export function createTmpDir(): string {
  return mkdtempSync(join(tmpdir(), "blog-test-"));
}

export function setupContentDir(tmpDir: string, locale: string = "ko"): string {
  const localeDir = join(tmpDir, locale);
  mkdirSync(localeDir, { recursive: true });
  return localeDir;
}

export function writePost(
  contentDir: string,
  locale: string,
  slug: string,
  post: Partial<TestPost>,
): string {
  const localeDir = join(contentDir, locale);
  mkdirSync(localeDir, { recursive: true });

  const frontmatter: Record<string, unknown> = {
    title: post.title ?? "Test Post",
    description: post.description ?? "Test description",
    category: post.category ?? "article",
    tags: post.tags ?? [],
    publishedDate: post.publishedDate ?? "2025-01-15",
    draft: post.draft ?? false,
  };

  if (post.series) frontmatter.series = post.series;
  if (post.seriesOrder !== undefined)
    frontmatter.seriesOrder = post.seriesOrder;

  const filePath = join(localeDir, `${slug}.mdx`);
  const content = matter.stringify(post.body ?? "Test content.", frontmatter);
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}

export function cleanupTmpDir(tmpDir: string): void {
  rmSync(tmpDir, { recursive: true, force: true });
}

export function parseResult(result: { content: { text: string }[] }) {
  return JSON.parse(result.content[0].text);
}
