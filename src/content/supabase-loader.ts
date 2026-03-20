import type { Loader } from "astro/loaders";
import { createClient } from "@supabase/supabase-js";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { remarkMermaid } from "../lib/remark-mermaid";
import { remarkCallout } from "../lib/remark-callout";

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

        // Process markdown with unified pipeline to ensure plugins are applied
        const file = await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkCallout)
          .use(remarkMermaid)
          .use(remarkRehype, { allowDangerousHtml: true })
          .use(rehypeRaw)
          .use(rehypeStringify)
          .process(body);

        const html = String(file);

        const rendered = {
          html,
          metadata: {},
        };

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
