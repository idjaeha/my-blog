import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getPostTool } from "../../../mcp-server/src/tools/get-post.js";
import {
  createTmpDir,
  setupContentDir,
  writePost,
  cleanupTmpDir,
  parseResult,
} from "./helpers.js";

describe("get-post", () => {
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

  it("retrieves a post by slug and locale", async () => {
    writePost(tmpDir, "ko", "test-post", {
      title: "Test Post",
      description: "A test",
      category: "article",
      tags: ["test"],
    });

    const result = await getPostTool.handler({
      slug: "test-post",
      locale: "ko",
    });
    const data = parseResult(result);
    expect(data.title).toBe("Test Post");
    expect(data.slug).toBe("test-post");
    expect(data.locale).toBe("ko");
  });

  it("returns body content", async () => {
    writePost(tmpDir, "ko", "body-post", {
      title: "Body Post",
      body: "This is the body content.",
    });

    const result = await getPostTool.handler({
      slug: "body-post",
      locale: "ko",
    });
    const data = parseResult(result);
    expect(data.body).toContain("This is the body content.");
  });

  it("returns all frontmatter fields", async () => {
    writePost(tmpDir, "ko", "full-post", {
      title: "Full Post",
      description: "Full description",
      category: "tutorial",
      tags: ["react", "typescript"],
      publishedDate: "2025-03-01",
      draft: false,
    });

    const result = await getPostTool.handler({
      slug: "full-post",
      locale: "ko",
    });
    const data = parseResult(result);
    expect(data.title).toBe("Full Post");
    expect(data.description).toBe("Full description");
    expect(data.category).toBe("tutorial");
    expect(data.tags).toEqual(["react", "typescript"]);
    expect(data.draft).toBe(false);
  });

  it("returns error for non-existent post", async () => {
    const result = await getPostTool.handler({
      slug: "does-not-exist",
      locale: "ko",
    });

    expect(result.isError).toBe(true);
    const data = parseResult(result);
    expect(data.error).toBeDefined();
  });

  it("retrieves English locale posts", async () => {
    writePost(tmpDir, "en", "en-post", { title: "English Post" });

    const result = await getPostTool.handler({ slug: "en-post", locale: "en" });
    const data = parseResult(result);
    expect(data.title).toBe("English Post");
    expect(data.locale).toBe("en");
  });

  it("returns series metadata when present", async () => {
    writePost(tmpDir, "ko", "series-post", {
      title: "Series Post",
      series: "MCP Deep Dive",
      seriesOrder: 2,
    });

    const result = await getPostTool.handler({
      slug: "series-post",
      locale: "ko",
    });
    const data = parseResult(result);
    expect(data.series).toBe("MCP Deep Dive");
    expect(data.seriesOrder).toBe(2);
  });

  it("does not cross locales", async () => {
    writePost(tmpDir, "ko", "ko-only", { title: "Korean Only" });

    const result = await getPostTool.handler({ slug: "ko-only", locale: "en" });
    expect(result.isError).toBe(true);
  });
});
