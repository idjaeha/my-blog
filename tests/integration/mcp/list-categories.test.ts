import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseResult } from "./helpers.js";

vi.mock("../../../mcp-server/src/utils/api-client.js", () => ({
  apiRequest: vi.fn(),
  toolResponse: (data: unknown, isError = false) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    ...(isError && { isError: true }),
  }),
}));

import { listCategoriesTool } from "../../../mcp-server/src/tools/list-categories.js";
import { apiRequest } from "../../../mcp-server/src/utils/api-client.js";

const mockApiRequest = vi.mocked(apiRequest);

describe("list-categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns categories from API", async () => {
    const categories = [
      { name: "article", count: 5 },
      { name: "til", count: 3 },
    ];
    mockApiRequest.mockResolvedValue({
      data: categories,
      error: null,
      status: 200,
    });

    const result = await listCategoriesTool.handler({ locale: "ko" });
    const data = parseResult(result);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("article");
    expect(data[0].count).toBe(5);
  });

  it("passes locale to API", async () => {
    mockApiRequest.mockResolvedValue({ data: [], error: null, status: 200 });

    await listCategoriesTool.handler({ locale: "en" });

    expect(mockApiRequest).toHaveBeenCalledWith("/categories", {
      params: { locale: "en" },
    });
  });

  it("returns empty list when no categories exist", async () => {
    mockApiRequest.mockResolvedValue({ data: [], error: null, status: 200 });

    const result = await listCategoriesTool.handler({ locale: "ko" });
    const data = parseResult(result);
    expect(data).toEqual([]);
  });

  it("returns API error", async () => {
    mockApiRequest.mockResolvedValue({
      data: null,
      error: "Server error",
      status: 500,
    });

    const result = await listCategoriesTool.handler({ locale: "ko" });
    expect(result.isError).toBe(true);
  });
});
