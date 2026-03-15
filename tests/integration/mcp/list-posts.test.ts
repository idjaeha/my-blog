import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { listPostsTool } from "../../../mcp-server/src/tools/list-posts.js";
import {
  createTmpDir,
  setupContentDir,
  writePost,
  cleanupTmpDir,
  parseResult,
} from "./helpers.js";

describe("list-posts", () => {
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

  it("returns empty list when no posts exist", async () => {
    const result = await listPostsTool.handler({
      locale: "ko",
      limit: 20,
      offset: 0,
    });
    const data = parseResult(result);
    expect(data.total).toBe(0);
    expect(data.posts).toEqual([]);
  });

  it("lists all posts in a locale", async () => {
    writePost(tmpDir, "ko", "post-1", { title: "Post 1" });
    writePost(tmpDir, "ko", "post-2", { title: "Post 2" });

    const result = await listPostsTool.handler({
      locale: "ko",
      limit: 20,
      offset: 0,
    });
    const data = parseResult(result);
    expect(data.total).toBe(2);
    expect(data.posts).toHaveLength(2);
  });

  it("filters by category", async () => {
    writePost(tmpDir, "ko", "til-post", { category: "til" });
    writePost(tmpDir, "ko", "article-post", { category: "article" });

    const result = await listPostsTool.handler({
      locale: "ko",
      category: "til",
      limit: 20,
      offset: 0,
    });
    const data = parseResult(result);
    expect(data.total).toBe(1);
    expect(data.posts[0].category).toBe("til");
  });

  it("filters by tag", async () => {
    writePost(tmpDir, "ko", "react-post", { tags: ["react", "typescript"] });
    writePost(tmpDir, "ko", "vue-post", { tags: ["vue"] });

    const result = await listPostsTool.handler({
      locale: "ko",
      tag: "react",
      limit: 20,
      offset: 0,
    });
    const data = parseResult(result);
    expect(data.total).toBe(1);
    expect(data.posts[0].slug).toBe("react-post");
  });

  it("filters by draft status", async () => {
    writePost(tmpDir, "ko", "published", { draft: false });
    writePost(tmpDir, "ko", "draft", { draft: true });

    const result = await listPostsTool.handler({
      locale: "ko",
      draft: false,
      limit: 20,
      offset: 0,
    });
    const data = parseResult(result);
    expect(data.total).toBe(1);
    expect(data.posts[0].slug).toBe("published");
  });

  it("sorts by publishedDate descending", async () => {
    writePost(tmpDir, "ko", "old", { publishedDate: "2024-01-01" });
    writePost(tmpDir, "ko", "new", { publishedDate: "2025-06-01" });
    writePost(tmpDir, "ko", "mid", { publishedDate: "2024-06-01" });

    const result = await listPostsTool.handler({
      locale: "ko",
      limit: 20,
      offset: 0,
    });
    const data = parseResult(result);
    expect(data.posts[0].slug).toBe("new");
    expect(data.posts[1].slug).toBe("mid");
    expect(data.posts[2].slug).toBe("old");
  });

  it("paginates with limit", async () => {
    writePost(tmpDir, "ko", "post-1", { publishedDate: "2025-03-01" });
    writePost(tmpDir, "ko", "post-2", { publishedDate: "2025-02-01" });
    writePost(tmpDir, "ko", "post-3", { publishedDate: "2025-01-01" });

    const result = await listPostsTool.handler({
      locale: "ko",
      limit: 2,
      offset: 0,
    });
    const data = parseResult(result);
    expect(data.total).toBe(3);
    expect(data.posts).toHaveLength(2);
  });

  it("paginates with offset", async () => {
    writePost(tmpDir, "ko", "post-1", { publishedDate: "2025-03-01" });
    writePost(tmpDir, "ko", "post-2", { publishedDate: "2025-02-01" });
    writePost(tmpDir, "ko", "post-3", { publishedDate: "2025-01-01" });

    const result = await listPostsTool.handler({
      locale: "ko",
      limit: 20,
      offset: 2,
    });
    const data = parseResult(result);
    expect(data.posts).toHaveLength(1);
    expect(data.posts[0].slug).toBe("post-3");
  });

  it("combines multiple filters", async () => {
    writePost(tmpDir, "ko", "match", {
      category: "til",
      tags: ["react"],
      draft: false,
    });
    writePost(tmpDir, "ko", "wrong-cat", {
      category: "article",
      tags: ["react"],
      draft: false,
    });
    writePost(tmpDir, "ko", "wrong-tag", {
      category: "til",
      tags: ["vue"],
      draft: false,
    });

    const result = await listPostsTool.handler({
      locale: "ko",
      category: "til",
      tag: "react",
      draft: false,
      limit: 20,
      offset: 0,
    });
    const data = parseResult(result);
    expect(data.total).toBe(1);
    expect(data.posts[0].slug).toBe("match");
  });

  it("separates posts by locale", async () => {
    writePost(tmpDir, "ko", "ko-post", { title: "Korean Post" });
    writePost(tmpDir, "en", "en-post", { title: "English Post" });

    const koResult = await listPostsTool.handler({
      locale: "ko",
      limit: 20,
      offset: 0,
    });
    const enResult = await listPostsTool.handler({
      locale: "en",
      limit: 20,
      offset: 0,
    });

    expect(parseResult(koResult).total).toBe(1);
    expect(parseResult(enResult).total).toBe(1);
  });

  it("returns error for non-existent locale directory", async () => {
    await listPostsTool.handler({
      locale: "ko",
      limit: 20,
      offset: 0,
    });

    // ko directory was set up in beforeEach, so this should work.
    // Let's test with a fresh tmpDir without setup
    const emptyDir = createTmpDir();
    process.env.BLOG_CONTENT_DIR = emptyDir;
    process.chdir(emptyDir);

    const errorResult = await listPostsTool.handler({
      locale: "ko",
      limit: 20,
      offset: 0,
    });

    expect(errorResult.isError).toBe(true);
    cleanupTmpDir(emptyDir);
  });

  it("returns correct pagination metadata", async () => {
    writePost(tmpDir, "ko", "post-1", {});

    const result = await listPostsTool.handler({
      locale: "ko",
      limit: 5,
      offset: 0,
    });
    const data = parseResult(result);
    expect(data.limit).toBe(5);
    expect(data.offset).toBe(0);
  });
});
