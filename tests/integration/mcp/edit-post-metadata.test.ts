import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseResult, samplePost } from "./helpers.js";

vi.mock("../../../mcp-server/src/utils/api-client.js", () => ({
  apiRequest: vi.fn(),
  toolResponse: (data: unknown, isError = false) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    ...(isError && { isError: true }),
  }),
}));

import { editPostMetadataTool } from "../../../mcp-server/src/tools/edit-post-metadata.js";
import { apiRequest } from "../../../mcp-server/src/utils/api-client.js";

const mockApiRequest = vi.mocked(apiRequest);

describe("edit-post-metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates title via PATCH API", async () => {
    const updated = samplePost({ title: "Updated Title" });
    mockApiRequest.mockResolvedValue({
      data: updated,
      error: null,
      status: 200,
    });

    const result = await editPostMetadataTool.handler({
      slug: "edit-me",
      locale: "ko",
      updates: { title: "Updated Title" },
    });

    const data = parseResult(result);
    expect(data.title).toBe("Updated Title");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/posts/edit-me",
      expect.objectContaining({
        method: "PATCH",
        body: expect.objectContaining({ title: "Updated Title", locale: "ko" }),
      }),
    );
  });

  it("sets updated_date automatically", async () => {
    const updated = samplePost({ updated_date: "2025-03-21T00:00:00Z" });
    mockApiRequest.mockResolvedValue({
      data: updated,
      error: null,
      status: 200,
    });

    await editPostMetadataTool.handler({
      slug: "date-check",
      locale: "ko",
      updates: { title: "Changed" },
    });

    const callBody = mockApiRequest.mock.calls[0][1]?.body as Record<
      string,
      unknown
    >;
    expect(callBody.updated_date).toBeDefined();
    expect(typeof callBody.updated_date).toBe("string");
  });

  it("updates tags", async () => {
    const updated = samplePost({ tags: ["new", "tags"] });
    mockApiRequest.mockResolvedValue({
      data: updated,
      error: null,
      status: 200,
    });

    const result = await editPostMetadataTool.handler({
      slug: "tag-update",
      locale: "ko",
      updates: { tags: ["new", "tags"] },
    });

    const data = parseResult(result);
    expect(data.tags).toEqual(["new", "tags"]);
  });

  it("updates category", async () => {
    const updated = samplePost({ category: "tutorial" });
    mockApiRequest.mockResolvedValue({
      data: updated,
      error: null,
      status: 200,
    });

    const result = await editPostMetadataTool.handler({
      slug: "cat-update",
      locale: "ko",
      updates: { category: "tutorial" },
    });

    const data = parseResult(result);
    expect(data.category).toBe("tutorial");
  });

  it("returns error for non-existent post", async () => {
    mockApiRequest.mockResolvedValue({
      data: null,
      error: "Post not found",
      status: 404,
    });

    const result = await editPostMetadataTool.handler({
      slug: "ghost",
      locale: "ko",
      updates: { title: "Nope" },
    });

    expect(result.isError).toBe(true);
  });

  it("updates draft status", async () => {
    const updated = samplePost({ draft: false });
    mockApiRequest.mockResolvedValue({
      data: updated,
      error: null,
      status: 200,
    });

    const result = await editPostMetadataTool.handler({
      slug: "draft-toggle",
      locale: "ko",
      updates: { draft: false },
    });

    const data = parseResult(result);
    expect(data.draft).toBe(false);
  });

  it("maps coverImage to cover_image for API", async () => {
    mockApiRequest.mockResolvedValue({
      data: samplePost(),
      error: null,
      status: 200,
    });

    await editPostMetadataTool.handler({
      slug: "img-post",
      locale: "ko",
      updates: { coverImage: "/images/cover.png" },
    });

    const callBody = mockApiRequest.mock.calls[0][1]?.body as Record<
      string,
      unknown
    >;
    expect(callBody.cover_image).toBe("/images/cover.png");
  });

  it("maps seriesOrder to series_order for API", async () => {
    mockApiRequest.mockResolvedValue({
      data: samplePost(),
      error: null,
      status: 200,
    });

    await editPostMetadataTool.handler({
      slug: "series-post",
      locale: "ko",
      updates: { seriesOrder: 3 },
    });

    const callBody = mockApiRequest.mock.calls[0][1]?.body as Record<
      string,
      unknown
    >;
    expect(callBody.series_order).toBe(3);
  });
});
