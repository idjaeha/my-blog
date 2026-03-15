import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { listCategoriesTool } from "../../../mcp-server/src/tools/list-categories.js";
import {
  createTmpDir,
  setupContentDir,
  writePost,
  cleanupTmpDir,
  parseResult,
} from "./helpers.js";

describe("list-categories", () => {
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
    const result = await listCategoriesTool.handler({ locale: "ko" });
    const data = parseResult(result);
    expect(data.total).toBe(0);
    expect(data.categories).toEqual([]);
  });

  it("aggregates categories across posts", async () => {
    writePost(tmpDir, "ko", "post-1", { category: "article" });
    writePost(tmpDir, "ko", "post-2", { category: "til" });

    const result = await listCategoriesTool.handler({ locale: "ko" });
    const data = parseResult(result);
    expect(data.total).toBe(2);
  });

  it("counts category occurrences correctly", async () => {
    writePost(tmpDir, "ko", "post-1", { category: "article" });
    writePost(tmpDir, "ko", "post-2", { category: "article" });
    writePost(tmpDir, "ko", "post-3", { category: "til" });

    const result = await listCategoriesTool.handler({ locale: "ko" });
    const data = parseResult(result);
    const article = data.categories.find(
      (c: { category: string }) => c.category === "article",
    );
    const til = data.categories.find(
      (c: { category: string }) => c.category === "til",
    );
    expect(article.count).toBe(2);
    expect(til.count).toBe(1);
  });

  it("sorts by count descending", async () => {
    writePost(tmpDir, "ko", "post-1", { category: "article" });
    writePost(tmpDir, "ko", "post-2", { category: "article" });
    writePost(tmpDir, "ko", "post-3", { category: "article" });
    writePost(tmpDir, "ko", "post-4", { category: "til" });

    const result = await listCategoriesTool.handler({ locale: "ko" });
    const data = parseResult(result);
    expect(data.categories[0].category).toBe("article");
    expect(data.categories[0].count).toBe(3);
  });

  it("separates categories by locale", async () => {
    writePost(tmpDir, "ko", "ko-post", { category: "article" });
    writePost(tmpDir, "en", "en-post-1", { category: "tutorial" });
    writePost(tmpDir, "en", "en-post-2", { category: "til" });

    const koResult = await listCategoriesTool.handler({ locale: "ko" });
    const enResult = await listCategoriesTool.handler({ locale: "en" });

    expect(parseResult(koResult).total).toBe(1);
    expect(parseResult(enResult).total).toBe(2);
  });

  it("returns error for non-existent locale directory", async () => {
    const emptyDir = createTmpDir();
    process.env.BLOG_CONTENT_DIR = emptyDir;
    process.chdir(emptyDir);

    const result = await listCategoriesTool.handler({ locale: "ko" });
    expect(result.isError).toBe(true);

    cleanupTmpDir(emptyDir);
  });
});
