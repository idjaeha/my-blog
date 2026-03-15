import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { editPostMetadataTool } from "../../../mcp-server/src/tools/edit-post-metadata.js";
import {
  createTmpDir,
  setupContentDir,
  writePost,
  cleanupTmpDir,
  parseResult,
} from "./helpers.js";

describe("edit-post-metadata", () => {
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

  it("updates title", async () => {
    writePost(tmpDir, "ko", "edit-me", { title: "Original" });

    const result = await editPostMetadataTool.handler({
      slug: "edit-me",
      locale: "ko",
      updates: { title: "Updated Title" },
    });

    const data = parseResult(result);
    expect(data.frontmatter.title).toBe("Updated Title");
  });

  it("sets updatedDate automatically", async () => {
    writePost(tmpDir, "ko", "date-check", { title: "Date Check" });

    const result = await editPostMetadataTool.handler({
      slug: "date-check",
      locale: "ko",
      updates: { title: "Changed" },
    });

    const data = parseResult(result);
    expect(data.frontmatter.updatedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("updates tags", async () => {
    writePost(tmpDir, "ko", "tag-update", { tags: ["old"] });

    const result = await editPostMetadataTool.handler({
      slug: "tag-update",
      locale: "ko",
      updates: { tags: ["new", "tags"] },
    });

    const data = parseResult(result);
    expect(data.frontmatter.tags).toEqual(["new", "tags"]);
  });

  it("updates category", async () => {
    writePost(tmpDir, "ko", "cat-update", { category: "article" });

    const result = await editPostMetadataTool.handler({
      slug: "cat-update",
      locale: "ko",
      updates: { category: "tutorial" },
    });

    const data = parseResult(result);
    expect(data.frontmatter.category).toBe("tutorial");
  });

  it("preserves body content after metadata edit", async () => {
    writePost(tmpDir, "ko", "body-preserve", {
      title: "Preserve Body",
      body: "Important content here.",
    });

    await editPostMetadataTool.handler({
      slug: "body-preserve",
      locale: "ko",
      updates: { title: "New Title" },
    });

    const raw = readFileSync(join(tmpDir, "ko", "body-preserve.mdx"), "utf-8");
    const { content } = matter(raw);
    expect(content).toContain("Important content here.");
  });

  it("preserves unchanged fields", async () => {
    writePost(tmpDir, "ko", "preserve-fields", {
      title: "Keep Me",
      description: "Also keep me",
      category: "article",
    });

    await editPostMetadataTool.handler({
      slug: "preserve-fields",
      locale: "ko",
      updates: { title: "Changed" },
    });

    const raw = readFileSync(
      join(tmpDir, "ko", "preserve-fields.mdx"),
      "utf-8",
    );
    const { data } = matter(raw);
    expect(data.description).toBe("Also keep me");
    expect(data.category).toBe("article");
  });

  it("returns error for non-existent post", async () => {
    const result = await editPostMetadataTool.handler({
      slug: "ghost",
      locale: "ko",
      updates: { title: "Nope" },
    });

    expect(result.isError).toBe(true);
  });

  it("updates draft status", async () => {
    writePost(tmpDir, "ko", "draft-toggle", { draft: true });

    const result = await editPostMetadataTool.handler({
      slug: "draft-toggle",
      locale: "ko",
      updates: { draft: false },
    });

    const data = parseResult(result);
    expect(data.frontmatter.draft).toBe(false);
  });
});
