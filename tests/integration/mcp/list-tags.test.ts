import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseResult } from "./helpers.js";

vi.mock("../../../mcp-server/src/utils/api-client.js", () => ({
  apiRequest: vi.fn(),
  toolResponse: (data: unknown, isError = false) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    ...(isError && { isError: true }),
  }),
}));

import { listTagsTool } from "../../../mcp-server/src/tools/list-tags.js";
import { apiRequest } from "../../../mcp-server/src/utils/api-client.js";

const mockApiRequest = vi.mocked(apiRequest);

describe("list-tags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns tags from API", async () => {
    const tags = [
      { name: "react", count: 3 },
      { name: "typescript", count: 2 },
    ];
    mockApiRequest.mockResolvedValue({ data: tags, error: null, status: 200 });

    const result = await listTagsTool.handler({ locale: "ko" });
    const data = parseResult(result);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("react");
    expect(data[0].count).toBe(3);
  });

  it("passes locale to API", async () => {
    mockApiRequest.mockResolvedValue({ data: [], error: null, status: 200 });

    await listTagsTool.handler({ locale: "en" });

    expect(mockApiRequest).toHaveBeenCalledWith("/tags", {
      params: { locale: "en" },
    });
  });

  it("returns empty list when no tags exist", async () => {
    mockApiRequest.mockResolvedValue({ data: [], error: null, status: 200 });

    const result = await listTagsTool.handler({ locale: "ko" });
    const data = parseResult(result);
    expect(data).toEqual([]);
  });

  it("returns API error", async () => {
    mockApiRequest.mockResolvedValue({
      data: null,
      error: "Server error",
      status: 500,
    });

    const result = await listTagsTool.handler({ locale: "ko" });
    expect(result.isError).toBe(true);
  });
});
