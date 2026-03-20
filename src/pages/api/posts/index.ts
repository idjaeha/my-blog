import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabase";
import { validateApiKey, unauthorized, json } from "@/lib/api/auth";

export const prerender = false;

/** GET /api/posts — List posts with optional filters */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "ko";
  const category = url.searchParams.get("category");
  const tag = url.searchParams.get("tag");
  const draft = url.searchParams.get("draft");
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  let query = supabaseAdmin
    .from("posts")
    .select("*")
    .eq("locale", locale)
    .is("archived_at", null)
    .order("published_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);
  if (tag) query = query.contains("tags", [tag]);
  if (draft !== null) query = query.eq("draft", draft === "true");

  const { data, error } = await query;

  if (error) return json({ error: error.message }, 500);
  return json(data);
};

/** POST /api/posts — Create a new post (requires API key) */
export const POST: APIRoute = async ({ request }) => {
  const keyName = await validateApiKey(request);
  if (!keyName) return unauthorized();

  const body = await request.json();
  const {
    slug,
    locale = "ko",
    title,
    description,
    category,
    tags = [],
    body: content = "",
    draft = true,
    published_date,
    series,
    series_order,
    cover_image,
  } = body;

  if (!slug || !title || !description || !category) {
    return json(
      { error: "Missing required fields: slug, title, description, category" },
      400,
    );
  }

  const { data, error } = await supabaseAdmin
    .from("posts")
    .insert({
      slug,
      locale,
      title,
      description,
      category,
      tags,
      body: content,
      draft,
      published_date:
        published_date || (draft ? null : new Date().toISOString()),
      series,
      series_order,
      cover_image,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return json(
        {
          error: `Post with slug "${slug}" already exists for locale "${locale}"`,
        },
        409,
      );
    }
    return json({ error: error.message }, 500);
  }

  return json(data, 201);
};
