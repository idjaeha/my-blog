import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { createPostTool } from "../../../mcp-server/src/tools/create-post.js";
import {
  createTmpDir,
  setupContentDir,
  writePost,
  cleanupTmpDir,
  parseResult,
} from "./helpers.js";

describe("create-post", () => {
  let tmpDir: string;
  const originalEnv = process.env.BLOG_CONTENT_DIR;
  const originalCwd = process.cwd();

  beforeEach(() => {
    tmpDir = createTmpDir();
    setupContentDir(tmpDir, "ko");
    setupContentDir(tmpDir, "en");
    process.env.BLOG_CONTENT_DIR = tmpDir;
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.env.BLOG_CONTENT_DIR = originalEnv;
    process.chdir(originalCwd);
    cleanupTmpDir(tmpDir);
  });

  it("creates a new MDX post with frontmatter", async () => {
    const result = await createPostTool.handler({
      slug: "my-first-post",
      title: "My First Post",
      description: "A great post",
      category: "article",
      locale: "ko",
      draft: true,
    });

    const data = parseResult(result);
    expect(data.created).toBe("ko/my-first-post.mdx");
    expect(data.frontmatter.title).toBe("My First Post");
    expect(data.frontmatter.category).toBe("article");
    expect(data.frontmatter.draft).toBe(true);
  });

  it("writes valid MDX file to disk", async () => {
    await createPostTool.handler({
      slug: "disk-check",
      title: "Disk Check",
      description: "Check file on disk",
      category: "til",
      locale: "ko",
      draft: false,
    });

    const filePath = join(tmpDir, "ko", "disk-check.mdx");
    expect(existsSync(filePath)).toBe(true);

    const raw = readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    expect(data.title).toBe("Disk Check");
    expect(data.category).toBe("til");
  });

  it("includes tags in frontmatter", async () => {
    const result = await createPostTool.handler({
      slug: "tagged-post",
      title: "Tagged Post",
      description: "Post with tags",
      category: "article",
      locale: "ko",
      tags: ["react", "typescript"],
      draft: true,
    });

    const data = parseResult(result);
    expect(data.frontmatter.tags).toEqual(["react", "typescript"]);
  });

  it("defaults tags to empty array when not provided", async () => {
    const result = await createPostTool.handler({
      slug: "no-tags",
      title: "No Tags",
      description: "No tags here",
      category: "article",
      locale: "ko",
      draft: true,
    });

    const data = parseResult(result);
    expect(data.frontmatter.tags).toEqual([]);
  });

  it("adds publishedDate automatically", async () => {
    const result = await createPostTool.handler({
      slug: "dated-post",
      title: "Dated Post",
      description: "Has a date",
      category: "article",
      locale: "ko",
      draft: true,
    });

    const data = parseResult(result);
    expect(data.frontmatter.publishedDate).toMatch(
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2})?$/,
    );
  });

  it("prevents creating duplicate posts", async () => {
    writePost(tmpDir, "ko", "existing-post", { title: "Existing" });

    const result = await createPostTool.handler({
      slug: "existing-post",
      title: "Duplicate",
      description: "Should fail",
      category: "article",
      locale: "ko",
      draft: true,
    });

    expect(result.isError).toBe(true);
    const data = parseResult(result);
    expect(data.error).toContain("already exists");
  });

  it("creates posts in different locales", async () => {
    await createPostTool.handler({
      slug: "en-post",
      title: "English Post",
      description: "In English",
      category: "article",
      locale: "en",
      draft: true,
    });

    expect(existsSync(join(tmpDir, "en", "en-post.mdx"))).toBe(true);
  });

  it("includes body content in MDX", async () => {
    await createPostTool.handler({
      slug: "with-body",
      title: "With Body",
      description: "Has body content",
      category: "article",
      locale: "ko",
      draft: true,
      body: "Hello, this is the body content.",
    });

    const raw = readFileSync(join(tmpDir, "ko", "with-body.mdx"), "utf-8");
    const { content } = matter(raw);
    expect(content).toContain("Hello, this is the body content.");
  });

  it("includes series metadata when provided", async () => {
    const result = await createPostTool.handler({
      slug: "series-post",
      title: "Series Post",
      description: "Part of a series",
      category: "tutorial",
      locale: "ko",
      draft: true,
      series: "React Deep Dive",
      seriesOrder: 1,
    });

    const data = parseResult(result);
    expect(data.frontmatter.series).toBe("React Deep Dive");
    expect(data.frontmatter.seriesOrder).toBe(1);
  });

  it("omits series fields when not provided", async () => {
    const result = await createPostTool.handler({
      slug: "no-series",
      title: "No Series",
      description: "Not in a series",
      category: "article",
      locale: "ko",
      draft: true,
    });

    const data = parseResult(result);
    expect(data.frontmatter.series).toBeUndefined();
    expect(data.frontmatter.seriesOrder).toBeUndefined();
  });
});
