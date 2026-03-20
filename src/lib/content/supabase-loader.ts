import { supabase } from "../supabase";
import type { ContentService, Post } from "./types";

/**
 * Content loader that fetches blog posts from Supabase.
 * Used at build time to generate static pages.
 */
export class SupabaseContentLoader implements ContentService {
  async getPost(slug: string, locale: string = "ko"): Promise<Post | null> {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("locale", locale)
      .is("archived_at", null)
      .single();

    if (error || !data) return null;
    return this.mapRow(data);
  }

  async getAllPosts(locale: string = "ko"): Promise<Post[]> {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("locale", locale)
      .eq("draft", false)
      .is("archived_at", null)
      .order("published_date", { ascending: false });

    if (error || !data) return [];
    return data.map((row) => this.mapRow(row));
  }

  async getPostsByTag(tag: string, locale: string = "ko"): Promise<Post[]> {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("locale", locale)
      .eq("draft", false)
      .is("archived_at", null)
      .contains("tags", [tag])
      .order("published_date", { ascending: false });

    if (error || !data) return [];
    return data.map((row) => this.mapRow(row));
  }

  async getPostsByCategory(
    category: string,
    locale: string = "ko",
  ): Promise<Post[]> {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("locale", locale)
      .eq("category", category)
      .eq("draft", false)
      .is("archived_at", null)
      .order("published_date", { ascending: false });

    if (error || !data) return [];
    return data.map((row) => this.mapRow(row));
  }

  async getAllTags(locale: string = "ko"): Promise<string[]> {
    const { data, error } = await supabase
      .from("posts")
      .select("tags")
      .eq("locale", locale)
      .eq("draft", false)
      .is("archived_at", null);

    if (error || !data) return [];
    const tags = new Set(data.flatMap((row) => row.tags ?? []));
    return [...tags].sort();
  }

  async getAllCategories(locale: string = "ko"): Promise<string[]> {
    const { data, error } = await supabase
      .from("posts")
      .select("category")
      .eq("locale", locale)
      .eq("draft", false)
      .is("archived_at", null);

    if (error || !data) return [];
    const categories = new Set(data.map((row) => row.category));
    return [...categories].sort();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRow(row: any): Post {
    return {
      id: `${row.locale}/${row.slug}`,
      slug: row.slug,
      locale: row.locale,
      title: row.title,
      description: row.description,
      category: row.category,
      tags: row.tags ?? [],
      publishedDate: new Date(row.published_date),
      updatedDate: row.updated_date ? new Date(row.updated_date) : undefined,
      draft: row.draft,
      coverImage: row.cover_image ?? undefined,
      series: row.series ?? undefined,
      seriesOrder: row.series_order ?? undefined,
      body: row.body,
      render: async () => {
        // MDX rendering is handled at the page level
        // This returns the raw body for processing
        throw new Error(
          "SupabaseContentLoader does not support render(). " +
            "Use the body field directly with an MDX processor.",
        );
      },
    };
  }
}
