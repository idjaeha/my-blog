import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabase";
import { validateApiKey, unauthorized, json } from "@/lib/api/auth";
import { selfRevalidate } from "@/lib/revalidate-helper";

export const prerender = false;

/** GET /api/posts/[slug]?locale=ko — Get a single post */
export const GET: APIRoute = async ({ params, request }) => {
  const { slug } = params;
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "ko";

  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("locale", locale)
    .is("archived_at", null)
    .single();

  if (error || !data) return json({ error: "Post not found" }, 404);
  return json(data);
};

/** PATCH /api/posts/[slug] — Update a post (requires API key) */
export const PATCH: APIRoute = async ({ params, request }) => {
  const keyName = await validateApiKey(request);
  if (!keyName) return unauthorized();

  const { slug } = params;
  const body = await request.json();
  const locale = body.locale || "ko";

  // Only allow updating known fields
  const allowedFields = [
    "title",
    "description",
    "category",
    "tags",
    "body",
    "draft",
    "published_date",
    "updated_date",
    "series",
    "series_order",
    "cover_image",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return json({ error: "No valid fields to update" }, 400);
  }

  // Auto-set published_date when publishing
  if (updates.draft === false) {
    const { data: existing } = await supabaseAdmin
      .from("posts")
      .select("published_date")
      .eq("slug", slug)
      .eq("locale", locale)
      .single();

    if (existing && !existing.published_date && !updates.published_date) {
      updates.published_date = new Date().toISOString();
    }
  }

  const { data, error } = await supabaseAdmin
    .from("posts")
    .update(updates)
    .eq("slug", slug)
    .eq("locale", locale)
    .is("archived_at", null)
    .select()
    .single();

  if (error || !data) return json({ error: "Post not found" }, 404);

  const revalidated = await selfRevalidate(slug!, locale, request);
  return json({ ...data, _selfRevalidated: revalidated });
};

/** DELETE /api/posts/[slug]?locale=ko — Soft delete a post (requires API key) */
export const DELETE: APIRoute = async ({ params, request }) => {
  const keyName = await validateApiKey(request);
  if (!keyName) return unauthorized();

  const { slug } = params;
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "ko";

  const { data, error } = await supabaseAdmin
    .from("posts")
    .update({ archived_at: new Date().toISOString() })
    .eq("slug", slug)
    .eq("locale", locale)
    .is("archived_at", null)
    .select()
    .single();

  if (error || !data) return json({ error: "Post not found" }, 404);

  const revalidated = await selfRevalidate(slug!, locale, request);
  return json({
    message: "Post archived",
    slug,
    locale,
    _selfRevalidated: revalidated,
  });
};
