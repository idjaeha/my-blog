/**
 * HTTP client for the blog API endpoints.
 * Replaces direct filesystem access with API calls.
 */

const API_URL = process.env.BLOG_API_URL || "http://localhost:4321/api";
const API_KEY = process.env.BLOG_API_KEY || "";

interface RequestOptions {
  method?: string;
  params?: Record<string, string | undefined>;
  body?: unknown;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T | null; error: string | null; status: number }> {
  const { method = "GET", params, body } = options;

  const url = new URL(`${API_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg =
      (data as Record<string, string>)?.error || `HTTP ${res.status}`;
    return { data: null, error: errorMsg, status: res.status };
  }

  return { data: data as T, error: null, status: res.status };
}

/** Helper: format tool response */
export function toolResponse(data: unknown, isError = false) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
    ...(isError && { isError: true }),
  };
}
