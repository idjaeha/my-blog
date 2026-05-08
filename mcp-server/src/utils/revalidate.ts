/**
 * Trigger Vercel ISR on-demand revalidation for a single post path.
 * Best-effort — failures are returned but never thrown, so a successful
 * mutation isn't masked by an unrelated revalidate hiccup.
 */

const SITE_URL = process.env.BLOG_SITE_URL || "";
const BYPASS_TOKEN = process.env.ISR_BYPASS_TOKEN || "";

export async function triggerRevalidate(
  slug: string,
  locale: string = "ko",
): Promise<{ ok: boolean; error?: string }> {
  if (!SITE_URL || !BYPASS_TOKEN) {
    return {
      ok: false,
      error: "BLOG_SITE_URL or ISR_BYPASS_TOKEN env not set; skipping",
    };
  }

  try {
    const url = `${SITE_URL.replace(/\/$/, "")}/api/revalidate`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, locale, bypassToken: BYPASS_TOKEN }),
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
