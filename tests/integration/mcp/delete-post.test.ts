import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseResult } from "./helpers.js";

vi.mock("../../../mcp-server/src/utils/api-client.js", () => ({
  apiRequest: vi.fn(),
  toolResponse: (data: unknown, isError = false) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    ...(isError && { isError: true }),
  }),
}));

import { deletePostTool } from "../../../mcp-server/src/tools/delete-post.js";
import { apiRequest } from "../../../mcp-server/src/utils/api-client.js";

const mockApiRequest = vi.mocked(apiRequest);

describe("delete-post", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("archives a post via DELETE API", async () => {
    mockApiRequest.mockResolvedValue({
      data: { message: "Post archived", slug: "to-delete", locale: "ko" },
      error: null,
      status: 200,
    });

    const result = await deletePostTool.handler({
      slug: "to-delete",
      locale: "ko",
    });
    const data = parseResult(result);
    expect(data.message).toBe("Post archived");
    expect(mockApiRequest).toHaveBeenCalledWith("/posts/to-delete", {
      method: "DELETE",
      params: { locale: "ko" },
    });
  });

  it("returns error for non-existent post", async () => {
    mockApiRequest.mockResolvedValue({
      data: null,
      error: "Post not found",
      status: 404,
    });

    const result = await deletePostTool.handler({
      slug: "ghost",
      locale: "ko",
    });
    expect(result.isError).toBe(true);
  });

  it("handles different locales correctly", async () => {
    mockApiRequest.mockResolvedValue({
      data: { message: "Post archived", slug: "en-delete", locale: "en" },
      error: null,
      status: 200,
    });

    const result = await deletePostTool.handler({
      slug: "en-delete",
      locale: "en",
    });
    const data = parseResult(result);
    expect(data.locale).toBe("en");
    expect(mockApiRequest).toHaveBeenCalledWith("/posts/en-delete", {
      method: "DELETE",
      params: { locale: "en" },
    });
  });
});
