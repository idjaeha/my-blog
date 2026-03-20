import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseResult, samplePost } from "./helpers.js";

vi.mock("../../../mcp-server/src/utils/api-client.js", () => ({
  apiRequest: vi.fn(),
  toolResponse: (data: unknown, isError = false) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    ...(isError && { isError: true }),
  }),
}));

import { getPostTool } from "../../../mcp-server/src/tools/get-post.js";
import { apiRequest } from "../../../mcp-server/src/utils/api-client.js";

const mockApiRequest = vi.mocked(apiRequest);

describe("get-post", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves a post by slug and locale", async () => {
    const post = samplePost({ slug: "test-post", title: "Test Post" });
    mockApiRequest.mockResolvedValue({ data: post, error: null, status: 200 });

    const result = await getPostTool.handler({
      slug: "test-post",
      locale: "ko",
    });
    const data = parseResult(result);

    expect(data.title).toBe("Test Post");
    expect(data.slug).toBe("test-post");
    expect(mockApiRequest).toHaveBeenCalledWith("/posts/test-post", {
      params: { locale: "ko" },
    });
  });

  it("returns body content", async () => {
    const post = samplePost({ body: "This is the body content." });
    mockApiRequest.mockResolvedValue({ data: post, error: null, status: 200 });

    const result = await getPostTool.handler({
      slug: "body-post",
      locale: "ko",
    });
    const data = parseResult(result);
    expect(data.body).toContain("This is the body content.");
  });

  it("returns all fields", async () => {
    const post = samplePost({
      title: "Full Post",
      description: "Full description",
      category: "tutorial",
      tags: ["react", "typescript"],
      draft: false,
    });
    mockApiRequest.mockResolvedValue({ data: post, error: null, status: 200 });

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
    mockApiRequest.mockResolvedValue({
      data: null,
      error: "Post not found",
      status: 404,
    });

    const result = await getPostTool.handler({
      slug: "does-not-exist",
      locale: "ko",
    });
    expect(result.isError).toBe(true);
    const data = parseResult(result);
    expect(data.error).toBeDefined();
  });

  it("retrieves English locale posts", async () => {
    const post = samplePost({ title: "English Post", locale: "en" });
    mockApiRequest.mockResolvedValue({ data: post, error: null, status: 200 });

    const result = await getPostTool.handler({ slug: "en-post", locale: "en" });
    const data = parseResult(result);
    expect(data.title).toBe("English Post");
    expect(data.locale).toBe("en");
    expect(mockApiRequest).toHaveBeenCalledWith("/posts/en-post", {
      params: { locale: "en" },
    });
  });

  it("returns series metadata when present", async () => {
    const post = samplePost({ series: "MCP Deep Dive", series_order: 2 });
    mockApiRequest.mockResolvedValue({ data: post, error: null, status: 200 });

    const result = await getPostTool.handler({
      slug: "series-post",
      locale: "ko",
    });
    const data = parseResult(result);
    expect(data.series).toBe("MCP Deep Dive");
    expect(data.series_order).toBe(2);
  });

  it("does not cross locales", async () => {
    mockApiRequest.mockResolvedValue({
      data: null,
      error: "Post not found",
      status: 404,
    });

    const result = await getPostTool.handler({ slug: "ko-only", locale: "en" });
    expect(result.isError).toBe(true);
  });
});
