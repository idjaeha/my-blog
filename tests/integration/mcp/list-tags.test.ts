import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { listTagsTool } from "../../../mcp-server/src/tools/list-tags.js";
import {
  createTmpDir,
  setupContentDir,
  writePost,
  cleanupTmpDir,
  parseResult,
} from "./helpers.js";

describe("list-tags", () => {
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
    const result = await listTagsTool.handler({ locale: "ko" });
    const data = parseResult(result);
    expect(data.total).toBe(0);
    expect(data.tags).toEqual([]);
  });

  it("aggregates tags across posts", async () => {
    writePost(tmpDir, "ko", "post-1", { tags: ["react", "typescript"] });
    writePost(tmpDir, "ko", "post-2", { tags: ["react", "node"] });

    const result = await listTagsTool.handler({ locale: "ko" });
    const data = parseResult(result);
    expect(data.total).toBe(3); // react, typescript, node
  });

  it("counts tag occurrences correctly", async () => {
    writePost(tmpDir, "ko", "post-1", { tags: ["react"] });
    writePost(tmpDir, "ko", "post-2", { tags: ["react"] });
    writePost(tmpDir, "ko", "post-3", { tags: ["vue"] });

    const result = await listTagsTool.handler({ locale: "ko" });
    const data = parseResult(result);
    const reactTag = data.tags.find((t: { tag: string }) => t.tag === "react");
    const vueTag = data.tags.find((t: { tag: string }) => t.tag === "vue");
    expect(reactTag.count).toBe(2);
    expect(vueTag.count).toBe(1);
  });

  it("sorts by count descending", async () => {
    writePost(tmpDir, "ko", "post-1", { tags: ["react", "node"] });
    writePost(tmpDir, "ko", "post-2", { tags: ["react", "typescript"] });
    writePost(tmpDir, "ko", "post-3", { tags: ["react"] });

    const result = await listTagsTool.handler({ locale: "ko" });
    const data = parseResult(result);
    expect(data.tags[0].tag).toBe("react");
    expect(data.tags[0].count).toBe(3);
  });

  it("handles posts without tags", async () => {
    writePost(tmpDir, "ko", "no-tags", { tags: [] });
    writePost(tmpDir, "ko", "with-tags", { tags: ["react"] });

    const result = await listTagsTool.handler({ locale: "ko" });
    const data = parseResult(result);
    expect(data.total).toBe(1);
  });

  it("separates tags by locale", async () => {
    writePost(tmpDir, "ko", "ko-post", { tags: ["react"] });
    writePost(tmpDir, "en", "en-post", { tags: ["react", "node"] });

    const koResult = await listTagsTool.handler({ locale: "ko" });
    const enResult = await listTagsTool.handler({ locale: "en" });

    expect(parseResult(koResult).total).toBe(1);
    expect(parseResult(enResult).total).toBe(2);
  });

  it("returns error for non-existent locale directory", async () => {
    const emptyDir = createTmpDir();
    process.env.BLOG_CONTENT_DIR = emptyDir;
    process.chdir(emptyDir);

    const result = await listTagsTool.handler({ locale: "ko" });
    expect(result.isError).toBe(true);

    cleanupTmpDir(emptyDir);
  });

  it("handles duplicate tags within a single post", async () => {
    writePost(tmpDir, "ko", "dup-tags", { tags: ["react", "react"] });

    const result = await listTagsTool.handler({ locale: "ko" });
    const data = parseResult(result);
    // gray-matter preserves duplicates in the array, so count should be 2
    const reactTag = data.tags.find((t: { tag: string }) => t.tag === "react");
    expect(reactTag.count).toBe(2);
  });
});
