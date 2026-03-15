import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { publishPostTool } from "../../../mcp-server/src/tools/publish-post.js";
import {
  createTmpDir,
  setupContentDir,
  writePost,
  cleanupTmpDir,
  parseResult,
} from "./helpers.js";

describe("publish-post", () => {
  let tmpDir: string;
  const originalEnv = process.env.BLOG_CONTENT_DIR;
  const originalCwd = process.cwd();

  beforeEach(() => {
    tmpDir = createTmpDir();
    setupContentDir(tmpDir, "ko");
    process.env.BLOG_CONTENT_DIR = tmpDir;
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.env.BLOG_CONTENT_DIR = originalEnv;
    process.chdir(originalCwd);
    cleanupTmpDir(tmpDir);
  });

  it("sets draft to false", async () => {
    writePost(tmpDir, "ko", "draft-post", { draft: true });

    const result = await publishPostTool.handler({
      slug: "draft-post",
      locale: "ko",
    });

    const data = parseResult(result);
    expect(data.wasDraft).toBe(true);

    const raw = readFileSync(join(tmpDir, "ko", "draft-post.mdx"), "utf-8");
    const { data: fm } = matter(raw);
    expect(fm.draft).toBe(false);
  });

  it("updates publishedDate when publishing a draft", async () => {
    writePost(tmpDir, "ko", "date-update", {
      draft: true,
      publishedDate: "2024-01-01",
    });

    const result = await publishPostTool.handler({
      slug: "date-update",
      locale: "ko",
    });

    const data = parseResult(result);
    expect(data.wasDraft).toBe(true);
    expect(data.publishedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Should be today, not the old date
    expect(data.publishedDate).not.toBe("2024-01-01");
  });

  it("does not update publishedDate for already published posts", async () => {
    writePost(tmpDir, "ko", "already-pub", {
      draft: false,
      publishedDate: "2024-06-15",
    });

    const result = await publishPostTool.handler({
      slug: "already-pub",
      locale: "ko",
    });

    const data = parseResult(result);
    expect(data.wasDraft).toBe(false);
  });

  it("preserves body content", async () => {
    writePost(tmpDir, "ko", "body-keep", {
      draft: true,
      body: "My important content.",
    });

    await publishPostTool.handler({ slug: "body-keep", locale: "ko" });

    const raw = readFileSync(join(tmpDir, "ko", "body-keep.mdx"), "utf-8");
    const { content } = matter(raw);
    expect(content).toContain("My important content.");
  });

  it("returns error for non-existent post", async () => {
    const result = await publishPostTool.handler({
      slug: "ghost",
      locale: "ko",
    });

    expect(result.isError).toBe(true);
  });

  it("returns published path", async () => {
    writePost(tmpDir, "ko", "path-check", { draft: true });

    const result = await publishPostTool.handler({
      slug: "path-check",
      locale: "ko",
    });

    const data = parseResult(result);
    expect(data.published).toBe("ko/path-check.mdx");
  });
});
