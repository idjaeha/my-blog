import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabase";
import { json } from "@/lib/api/auth";

export const prerender = false;

/** GET /api/tags?locale=ko — Get all tags with counts */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "ko";

  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("tags")
    .eq("locale", locale)
    .eq("draft", false)
    .is("archived_at", null);

  if (error) return json({ error: error.message }, 500);

  const tagCounts: Record<string, number> = {};
  for (const row of data ?? []) {
    for (const tag of row.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const tags = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return json(tags);
};
