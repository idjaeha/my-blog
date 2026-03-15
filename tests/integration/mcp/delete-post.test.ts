import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { deletePostTool } from "../../../mcp-server/src/tools/delete-post.js";
import {
  createTmpDir,
  setupContentDir,
  writePost,
  cleanupTmpDir,
  parseResult,
} from "./helpers.js";

describe("delete-post", () => {
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

  it("moves post to _archive directory", async () => {
    writePost(tmpDir, "ko", "to-delete", { title: "Delete Me" });

    const result = await deletePostTool.handler({
      slug: "to-delete",
      locale: "ko",
    });

    const data = parseResult(result);
    expect(data.archived).toBe("ko/to-delete.mdx");
    expect(data.destination).toBe("_archive/ko-to-delete.mdx");
  });

  it("removes original file", async () => {
    writePost(tmpDir, "ko", "remove-check", { title: "Remove Check" });

    await deletePostTool.handler({ slug: "remove-check", locale: "ko" });

    expect(existsSync(join(tmpDir, "ko", "remove-check.mdx"))).toBe(false);
  });

  it("creates archive file", async () => {
    writePost(tmpDir, "ko", "archive-check", { title: "Archive Check" });

    await deletePostTool.handler({ slug: "archive-check", locale: "ko" });

    expect(existsSync(join(tmpDir, "_archive", "ko-archive-check.mdx"))).toBe(
      true,
    );
  });

  it("creates _archive directory if not exists", async () => {
    writePost(tmpDir, "ko", "first-delete", { title: "First Delete" });

    expect(existsSync(join(tmpDir, "_archive"))).toBe(false);

    await deletePostTool.handler({ slug: "first-delete", locale: "ko" });

    expect(existsSync(join(tmpDir, "_archive"))).toBe(true);
  });

  it("returns error for non-existent post", async () => {
    const result = await deletePostTool.handler({
      slug: "ghost",
      locale: "ko",
    });

    expect(result.isError).toBe(true);
  });

  it("handles different locales correctly", async () => {
    writePost(tmpDir, "en", "en-delete", { title: "English Delete" });

    const result = await deletePostTool.handler({
      slug: "en-delete",
      locale: "en",
    });

    const data = parseResult(result);
    expect(data.destination).toBe("_archive/en-en-delete.mdx");
    expect(existsSync(join(tmpDir, "_archive", "en-en-delete.mdx"))).toBe(true);
  });
});
