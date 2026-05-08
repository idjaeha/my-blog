/**
 * Server-side ISR revalidation triggered from inside the my-blog API
 * after a post is created / updated / deleted. Avoids relying on the
 * caller (e.g. MCP server child) to forward ISR_BYPASS_TOKEN — we read
 * it from this server's own env and self-call.
 *
 * Best-effort: failures are reported in the result but never thrown.
 */

interface RevalidateResult {
  ok: boolean;
  results?: Array<{
    url: string;
    ok: boolean;
    status?: number;
    error?: string;
  }>;
  error?: string;
}

export async function selfRevalidate(
  slug: string,
  locale: string,
  request: Request,
): Promise<RevalidateResult> {
  const bypassToken = import.meta.env.ISR_BYPASS_TOKEN;
  if (!bypassToken) {
    return { ok: false, error: "ISR_BYPASS_TOKEN not configured" };
  }

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const pathPrefix = locale === "ko" ? "" : `/${locale}`;

  const targets = [
    `${baseUrl}${pathPrefix}/blog/${slug}`,
    `${baseUrl}${pathPrefix}/blog`,
  ];

  const results = await Promise.all(
    targets.map(async (u) => {
      try {
        const res = await fetch(u, {
          headers: { "x-prerender-revalidate": bypassToken },
        });
        return { url: u, ok: res.ok, status: res.status };
      } catch (e) {
        return {
          url: u,
          ok: false,
          error: e instanceof Error ? e.message : "Unknown error",
        };
      }
    }),
  );

  return { ok: results.every((r) => r.ok), results };
}
