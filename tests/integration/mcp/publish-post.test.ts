import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseResult, samplePost } from "./helpers.js";

vi.mock("../../../mcp-server/src/utils/api-client.js", () => ({
  apiRequest: vi.fn(),
  toolResponse: (data: unknown, isError = false) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    ...(isError && { isError: true }),
  }),
}));

import { publishPostTool } from "../../../mcp-server/src/tools/publish-post.js";
import { apiRequest } from "../../../mcp-server/src/utils/api-client.js";

const mockApiRequest = vi.mocked(apiRequest);

describe("publish-post", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets draft to false via PATCH API", async () => {
    const published = samplePost({
      draft: false,
      published_date: "2025-03-21T00:00:00Z",
    });
    mockApiRequest.mockResolvedValue({
      data: published,
      error: null,
      status: 200,
    });

    const result = await publishPostTool.handler({
      slug: "draft-post",
      locale: "ko",
    });
    const data = parseResult(result);

    expect(data.draft).toBe(false);
    expect(mockApiRequest).toHaveBeenCalledWith("/posts/draft-post", {
      method: "PATCH",
      body: { locale: "ko", draft: false },
    });
  });

  it("returns published post data", async () => {
    const published = samplePost({
      draft: false,
      published_date: "2025-03-21T00:00:00Z",
      title: "Now Published",
    });
    mockApiRequest.mockResolvedValue({
      data: published,
      error: null,
      status: 200,
    });

    const result = await publishPostTool.handler({
      slug: "pub-post",
      locale: "ko",
    });
    const data = parseResult(result);

    expect(data.title).toBe("Now Published");
    expect(data.published_date).toBeDefined();
  });

  it("returns error for non-existent post", async () => {
    mockApiRequest.mockResolvedValue({
      data: null,
      error: "Post not found",
      status: 404,
    });

    const result = await publishPostTool.handler({
      slug: "ghost",
      locale: "ko",
    });
    expect(result.isError).toBe(true);
  });

  it("handles different locales", async () => {
    const published = samplePost({ locale: "en", draft: false });
    mockApiRequest.mockResolvedValue({
      data: published,
      error: null,
      status: 200,
    });

    await publishPostTool.handler({ slug: "en-post", locale: "en" });

    expect(mockApiRequest).toHaveBeenCalledWith("/posts/en-post", {
      method: "PATCH",
      body: { locale: "en", draft: false },
    });
  });
});
