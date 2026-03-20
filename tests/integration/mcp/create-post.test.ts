import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseResult, samplePost } from "./helpers.js";

vi.mock("../../../mcp-server/src/utils/api-client.js", () => ({
  apiRequest: vi.fn(),
  toolResponse: (data: unknown, isError = false) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    ...(isError && { isError: true }),
  }),
}));

import { createPostTool } from "../../../mcp-server/src/tools/create-post.js";
import { apiRequest } from "../../../mcp-server/src/utils/api-client.js";

const mockApiRequest = vi.mocked(apiRequest);

describe("create-post", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new post via API", async () => {
    const created = samplePost({
      slug: "my-first-post",
      title: "My First Post",
      category: "article",
    });
    mockApiRequest.mockResolvedValue({
      data: created,
      error: null,
      status: 201,
    });

    const result = await createPostTool.handler({
      slug: "my-first-post",
      title: "My First Post",
      description: "A great post",
      category: "article",
      locale: "ko",
      draft: true,
    });

    const data = parseResult(result);
    expect(data.title).toBe("My First Post");
    expect(data.category).toBe("article");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/posts",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sends tags in request body", async () => {
    const created = samplePost({ tags: ["react", "typescript"] });
    mockApiRequest.mockResolvedValue({
      data: created,
      error: null,
      status: 201,
    });

    await createPostTool.handler({
      slug: "tagged-post",
      title: "Tagged Post",
      description: "Post with tags",
      category: "article",
      locale: "ko",
      tags: ["react", "typescript"],
      draft: true,
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/posts",
      expect.objectContaining({
        body: expect.objectContaining({ tags: ["react", "typescript"] }),
      }),
    );
  });

  it("defaults tags to empty array when not provided", async () => {
    mockApiRequest.mockResolvedValue({
      data: samplePost(),
      error: null,
      status: 201,
    });

    await createPostTool.handler({
      slug: "no-tags",
      title: "No Tags",
      description: "No tags here",
      category: "article",
      locale: "ko",
      draft: true,
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/posts",
      expect.objectContaining({
        body: expect.objectContaining({ tags: [] }),
      }),
    );
  });

  it("returns error for duplicate posts", async () => {
    mockApiRequest.mockResolvedValue({
      data: null,
      error: 'Post with slug "existing-post" already exists for locale "ko"',
      status: 409,
    });

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
    const created = samplePost({ locale: "en" });
    mockApiRequest.mockResolvedValue({
      data: created,
      error: null,
      status: 201,
    });

    await createPostTool.handler({
      slug: "en-post",
      title: "English Post",
      description: "In English",
      category: "article",
      locale: "en",
      draft: true,
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/posts",
      expect.objectContaining({
        body: expect.objectContaining({ locale: "en" }),
      }),
    );
  });

  it("sends body content", async () => {
    mockApiRequest.mockResolvedValue({
      data: samplePost(),
      error: null,
      status: 201,
    });

    await createPostTool.handler({
      slug: "with-body",
      title: "With Body",
      description: "Has body",
      category: "article",
      locale: "ko",
      draft: true,
      body: "Hello, this is the body content.",
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/posts",
      expect.objectContaining({
        body: expect.objectContaining({
          body: "Hello, this is the body content.",
        }),
      }),
    );
  });

  it("sends series metadata when provided", async () => {
    mockApiRequest.mockResolvedValue({
      data: samplePost(),
      error: null,
      status: 201,
    });

    await createPostTool.handler({
      slug: "series-post",
      title: "Series Post",
      description: "Part of a series",
      category: "tutorial",
      locale: "ko",
      draft: true,
      series: "React Deep Dive",
      seriesOrder: 1,
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/posts",
      expect.objectContaining({
        body: expect.objectContaining({
          series: "React Deep Dive",
          series_order: 1,
        }),
      }),
    );
  });

  it("omits series fields when not provided", async () => {
    mockApiRequest.mockResolvedValue({
      data: samplePost(),
      error: null,
      status: 201,
    });

    await createPostTool.handler({
      slug: "no-series",
      title: "No Series",
      description: "Not in a series",
      category: "article",
      locale: "ko",
      draft: true,
    });

    const callBody = mockApiRequest.mock.calls[0][1]?.body as Record<
      string,
      unknown
    >;
    expect(callBody.series).toBeUndefined();
    expect(callBody.series_order).toBeUndefined();
  });
});
