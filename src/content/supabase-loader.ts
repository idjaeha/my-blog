import type { Loader } from "astro/loaders";
import { createClient } from "@supabase/supabase-js";

export function supabaseBlogLoader(): Loader {
  return {
    name: "supabase-blog",
    async load(ctx) {
      const url = import.meta.env.SUPABASE_URL;
      const key = import.meta.env.SUPABASE_ANON_KEY;

      if (!url || !key) {
        ctx.logger.warn(
          "supabase-blog: SUPABASE_URL or SUPABASE_ANON_KEY not set, skipping",
        );
        return;
      }

      const supabase = createClient(url, key);

      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .eq("draft", false)
        .is("archived_at", null);

      if (error) {
        ctx.logger.error(`supabase-blog: ${error.message}`);
        return;
      }

      ctx.store.clear();

      for (const post of posts ?? []) {
        const id = `${post.locale}/${post.slug}`;
        const body = post.body ?? "";

        const rendered = await ctx.renderMarkdown(body);

        const data = await ctx.parseData({
          id,
          data: {
            title: post.title,
            description: post.description,
            category: post.category,
            tags: post.tags ?? [],
            publishedDate: post.published_date,
            updatedDate: post.updated_date ?? undefined,
            draft: post.draft,
            coverImage: post.cover_image ?? undefined,
            series: post.series ?? undefined,
            seriesOrder: post.series_order ?? undefined,
          },
        });

        ctx.store.set({
          id,
          data,
          body,
          rendered,
          digest: ctx.generateDigest(body),
        });
      }

      ctx.logger.info(
        `supabase-blog: loaded ${posts?.length ?? 0} posts from Supabase`,
      );
    },
  };
}
