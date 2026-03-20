/**
 * Parse the JSON text from a tool response.
 */
export function parseResult(result: { content: { text: string }[] }) {
  return JSON.parse(result.content[0].text);
}

/**
 * Sample post data matching Supabase row shape.
 */
export function samplePost(overrides: Record<string, unknown> = {}) {
  return {
    id: "test-uuid-1234",
    slug: "test-post",
    locale: "ko",
    title: "Test Post",
    description: "Test description",
    category: "article",
    tags: [],
    body: "",
    draft: true,
    published_date: null,
    updated_date: null,
    series: null,
    series_order: null,
    cover_image: null,
    archived_at: null,
    created_at: "2025-01-15T00:00:00Z",
    ...overrides,
  };
}
