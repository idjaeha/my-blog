import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabase";
import { json } from "@/lib/api/auth";

export const prerender = false;

/** GET /api/categories?locale=ko — Get all categories with counts */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "ko";

  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("category")
    .eq("locale", locale)
    .eq("draft", false)
    .is("archived_at", null);

  if (error) return json({ error: error.message }, 500);

  const categoryCounts: Record<string, number> = {};
  for (const row of data ?? []) {
    categoryCounts[row.category] = (categoryCounts[row.category] || 0) + 1;
  }

  const categories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return json(categories);
};
