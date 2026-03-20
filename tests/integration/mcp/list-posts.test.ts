import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseResult, samplePost } from "./helpers.js";

vi.mock("../../../mcp-server/src/utils/api-client.js", () => ({
  apiRequest: vi.fn(),
  toolResponse: (data: unknown, isError = false) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    ...(isError && { isError: true }),
  }),
}));

import { listPostsTool } from "../../../mcp-server/src/tools/list-posts.js";
import { apiRequest } from "../../../mcp-server/src/utils/api-client.js";

const mockApiRequest = vi.mocked(apiRequest);

describe("list-posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty list when no posts exist", async () => {
    mockApiRequest.mockResolvedValue({ data: [], error: null, status: 200 });

    const result = await listPostsTool.handler({
      locale: "ko",
      limit: 20,
      offset: 0,
    });
    const data = parseResult(result);
    expect(data).toEqual([]);
  });

  it("lists all posts in a locale", async () => {
    const posts = [
      samplePost({ slug: "post-1", title: "Post 1" }),
      samplePost({ slug: "post-2", title: "Post 2" }),
    ];
    mockApiRequest.mockResolvedValue({ data: posts, error: null, status: 200 });

    const result = await listPostsTool.handler({
      locale: "ko",
      limit: 20,
      offset: 0,
    });
    const data = parseResult(result);
    expect(data).toHaveLength(2);
  });

  it("passes category filter to API", async () => {
    mockApiRequest.mockResolvedValue({ data: [], error: null, status: 200 });

    await listPostsTool.handler({
      locale: "ko",
      category: "til",
      limit: 20,
      offset: 0,
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/posts",
      expect.objectContaining({
        params: expect.objectContaining({ category: "til" }),
      }),
    );
  });

  it("passes tag filter to API", async () => {
    mockApiRequest.mockResolvedValue({ data: [], error: null, status: 200 });

    await listPostsTool.handler({
      locale: "ko",
      tag: "react",
      limit: 20,
      offset: 0,
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/posts",
      expect.objectContaining({
        params: expect.objectContaining({ tag: "react" }),
      }),
    );
  });

  it("passes draft filter to API", async () => {
    mockApiRequest.mockResolvedValue({ data: [], error: null, status: 200 });

    await listPostsTool.handler({
      locale: "ko",
      draft: false,
      limit: 20,
      offset: 0,
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/posts",
      expect.objectContaining({
        params: expect.objectContaining({ draft: "false" }),
      }),
    );
  });

  it("passes pagination parameters to API", async () => {
    mockApiRequest.mockResolvedValue({ data: [], error: null, status: 200 });

    await listPostsTool.handler({ locale: "ko", limit: 5, offset: 10 });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/posts",
      expect.objectContaining({
        params: expect.objectContaining({ limit: "5", offset: "10" }),
      }),
    );
  });

  it("returns API error", async () => {
    mockApiRequest.mockResolvedValue({
      data: null,
      error: "Internal server error",
      status: 500,
    });

    const result = await listPostsTool.handler({
      locale: "ko",
      limit: 20,
      offset: 0,
    });
    expect(result.isError).toBe(true);
  });

  it("passes locale to API", async () => {
    mockApiRequest.mockResolvedValue({ data: [], error: null, status: 200 });

    await listPostsTool.handler({ locale: "en", limit: 20, offset: 0 });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/posts",
      expect.objectContaining({
        params: expect.objectContaining({ locale: "en" }),
      }),
    );
  });
});
